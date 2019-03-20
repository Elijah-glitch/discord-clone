import { defaultDataIdFromObject } from 'apollo-cache-inmemory'
import { useSubscription } from 'react-apollo-hooks'
import {
  DELETED_SERVER,
  USER_LOGGED_OUT,
  SENT_INVITATION,
  USER_JOINED_SERVER
} from '../../graphql/subscriptions'
import * as queries from '../../graphql/queries'
import * as fragments from '../../graphql/fragments'
import history from '../../config/history'
import { CURRENT_USER } from '../../graphql/queries'
import { find } from 'lodash'
import {
  CREATED_CHANNEL,
  DELETED_CHANNEL
} from '../../graphql/subscriptions/channel'

/** TODO - Organize subscriptions by modules */
export const useSubscriptions = () => {
  /** DeleteServer subscription */
  useSubscription(DELETED_SERVER, {
    onSubscriptionData: async ({ client, subscriptionData: { data } }) => {
      try {
        const { me } = client.readQuery({
          query: queries.CURRENT_USER
        })
        const servers = client.readQuery({
          query: queries.GET_USER_SERVERS,
          variables: { userId: me.id }
        })

        if (servers && servers.userServers) {
          client.writeQuery({
            query: queries.GET_USER_SERVERS,
            variables: { userId: me.id },
            data: {
              userServers: servers.userServers.filter(
                server => server.id !== data.deletedServer.id
              )
            }
          })
        } else {
          throw new Error("Can't find servers")
        }
      } catch (e) {
        console.log(e)
        return history.push('/')
      }
    }
  })

  /** invitation sub */
  useSubscription(SENT_INVITATION, {
    onSubscriptionData: async ({ client, subscriptionData: { data } }) => {
      const receiver = data.sentInvitation.receiver
      const { me } = client.readQuery({
        query: queries.CURRENT_USER
      })

      if (me.id === receiver.id) {
        try {
          const { getReceivedInvitations } = client.readQuery({
            query: queries.GET_RECEIVED_INVITATIONS,
            variables: { userId: me.id }
          })
          console.log('[GetReceivedInvitations]: ', getReceivedInvitations)
          client.writeQuery({
            query: queries.GET_RECEIVED_INVITATIONS,
            variables: { userId: me.id },
            data: {
              getReceivedInvitations: [
                ...getReceivedInvitations,
                data.sentInvitation
              ]
            }
          })
        } catch (error) {
          throw new Error(error)
        }
      }
    }
  })

  useSubscription(USER_JOINED_SERVER, {
    onSubscriptionData: async ({ client, subscriptionData: { data } }) => {
      try {
        const { me } = client.readQuery({
          query: queries.CURRENT_USER
        })
        const { userServers } = client.readQuery({
          query: queries.GET_USER_SERVERS,
          variables: { userId: me.id }
        })
        const foundServer = find(
          userServers,
          server => server.id === data.userJoinedServer.id
        )
        if (foundServer) {
          console.log('[User joined server]: fOund SERVER!')
          client.writeQuery({
            query: queries.GET_SERVER,
            variables: { serverId: data.userJoinedServer.id },
            data: {
              server: data.userJoinedServer
            }
          })
        }
      } catch (error) {
        throw new Error(error)
      }
    }
  })

  /** Channel Subscriptions */
  useSubscription(CREATED_CHANNEL, {
    onSubscriptionData: async ({ client, subscriptionData: { data } }) => {
      try {
        const { me } = client.readQuery({
          query: queries.CURRENT_USER
        })

        const foundUser = find(
          data.createdChannel.server.users,
          user => user.id === me.id
        )
        if (foundUser) {
          const { getServerChannels } = client.readQuery({
            query: queries.GET_SERVER_CHANNELS,
            variables: { serverId: data.createdChannel.server.id }
          })

          client.writeQuery({
            query: queries.GET_SERVER_CHANNELS,
            variables: { serverId: data.createdChannel.server.id },
            data: {
              getServerChannels: [...getServerChannels, data.createdChannel]
            }
          })
        }
      } catch (error) {
        throw new Error(error)
      }
    }
  })

  useSubscription(DELETED_CHANNEL, {
    onSubscriptionData: async ({ client, subscriptionData: { data } }) => {
      try {
        const { me } = client.readQuery({ query: queries.CURRENT_USER })
        const foundUser = find(
          data.deletedChannel.server.users,
          user => user.id === me.id
        )
        if (foundUser) {
          const { getServerChannels } = client.readQuery({
            query: queries.GET_SERVER_CHANNELS,
            variables: { serverId: data.deletedChannel.server.id }
          })

          client.writeQuery({
            query: queries.GET_SERVER_CHANNELS,
            variables: { serverId: data.deletedChannel.server.id },
            data: {
              getServerChannels: getServerChannels.filter(
                channel => channel.id !== data.deletedChannel.id
              )
            }
          })
        }
      } catch (error) {
        throw new Error(error)
      }
    }
  })

  /** User logged out */
  useSubscription(USER_LOGGED_OUT, {
    onSubscriptionData: async ({ client, subscriptionData: { data } }) => {
      let user
      try {
        user = await client.readQuery({
          query: queries.CURRENT_USER
        })
      } catch (e) {
        console.log('[User Logged out Error]: ', e)
      }
      if (user.me) {
        client.clearStore().then(() => history.push('/'))
      }
    }
  })
}
