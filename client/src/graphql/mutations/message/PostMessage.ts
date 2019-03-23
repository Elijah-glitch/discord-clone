import { gql } from 'apollo-boost'
import * as fragments from '../../fragments'

export default gql`
  mutation PostMessage($channelId:ID!, $message:String!) {
    postMessage(channelId: $channelId, message:$message) {
      ...Message
      channel {
        id
        name
      }
      sender {
        id
        name
      }
    }
  }
  ${fragments.message}
`