import React from 'react'
import PropTypes from 'prop-types'

import Contact from './contact'
import Content from './content'
import ContentTypes from '../content-types'
import Loop from '../loop'
import * as Model from '../models/model'

export default class Share extends React.PureComponent {
  static propTypes = {
    authorIds: PropTypes.arrayOf(PropTypes.string),
    contactIds: PropTypes.arrayOf(PropTypes.string),
    notifications: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      sender: PropTypes.object.isRequired,
      board: PropTypes.object.isRequired
    }))
  }

  static defaultProps = {
    authorIds: [],
    contactIds: [],
    notifications: []
  }

  constructor() {
    super()

    this.state = { tab: 'notifications' }
  }

  getHypermergeDoc(docId, cb) {
    window.hm.open(docId)
      .then(doc => {
        cb(null, doc)
      }, err => {
        cb(err)
      })
    // XXX fixme: lol
    window.hm.on('document:updated', (id, doc) => {
      if (id !== docId) {
        return
      }

      // unregister listener
      cb(null, doc)
    })
  }

  maybeBoardIdChanged() {
    if (this.props.doc.boardId && this.props.doc.boardId !== this.state.boardId) {
      this.getHypermergeDoc(this.props.doc.boardId, (docId, doc) => {
        this.setState({ boardId: docId, boardDoc: doc })
      })
    }
  }

  componentWillMount() {
    this.maybeBoardIdChanged()
  }

  // this probably doesn't work here...
  updateSelfOfferDocumentToIdentity(state, { identityId, sharedDocId }) {
    const self = state.hm.change(state.self, (s) => {
      if (!s.offeredIds) {
        s.offeredIds = {}
      }

      if (!s.offeredIds[identityId]) {
        s.offeredIds[identityId] = []
      }

      s.offeredIds[identityId].push(sharedDocId)
    })
    return { ...state, self }
  }

  handleShare(e, contact) {
    // TODO
    // i deleted board.docId and broke the updateSelfOfferDocumentToIdentity,
    // but at least I pasted the code above ^^^^
    Loop.dispatch(
      this.updateSelfOfferDocumentToIdentity,
      { identityId: contact.docId, sharedDocId: this.props.board.docId }
    )
  }

  handleUnshare(e, contact) {
    alert(`Unshare '${this.state.boardDoc.title}' from ${contact.name}`)
  }

  renderContacts() {
    const authorIds = this.state.boardDoc && this.state.boardDoc.authorIds || []

    const authors = authorIds.map(id => (
      <Content
        key={id}
        card={{ type: 'contact', docId: id }}
      />
    ))

    const contactIds = this.props.doc.contactIds || []

    const contacts = contactIds.map(id => (
      <Content
        key={id}
        card={{ type: 'contact', docId: id }}
        actions={['share']}
        onShare={e => this.handleShare(e, id)}
      />
    ))

    return (
      <div>
        <div className="ListMenu__segment">On Board</div>
        <div className="ListMenu__section">
          { authors }
        </div>
        { (contacts.length > 0) && <div className="ListMenu__segment">All</div> }
        <div className="ListMenu__section">
          { contacts }
        </div>
      </div>
    )
  }

  acceptNotification(notification) {
    // i deleted board.docId
    Loop.dispatch(Model.openAndRequestBoard, { docId: notification.board.docId })
  }

  renderNotifications() {
    const notifications = this.props.notifications.map(notification => (
      // we should create a more unique key; do we want to allow the same share multiple times?
      // i'm going to block it on the send side for now
      <div key={`${notification.sender.name}-${notification.board.title}`} className="ListMenu__item">
        <div className="ListMenu__grouped">
          <div className="ListMenu__typegroup">
            <h4 className="Type--primary">{ notification.board.title }</h4>
            <p className="Type--secondary">From { notification.sender.name }</p>
          </div>
          <div className="ButtonGroup">
            <div
              role="button"
              className="ButtonAction ButtonAction--primary"
              onClick={e => this.acceptNotification(notification)}
            >
              <i className="fa fa-arrow-right" />
              <p className="ButtonAction__label">View</p>
            </div>
            <div
              role="button"
              className="ButtonAction ButtonAction--destructive"
              onClick={e => alert(`Archive ${notification.board.title}`)}
            >
              <i className="fa fa-archive" />
              <p className="ButtonAction__label">Archive</p>
            </div>
          </div>
        </div>
      </div>
    ))

    return (
      <div className="ListMenu__section">
        { notifications.length > 0 ? notifications :
        <div className="ListMenu__item">
          <div className="ListMenu__grouped">
            <div className="ListMenu__typegroup">
              <i className="fa fa-info-circle" />
              <p className="Type--primary">
                Nothing here!.
              </p>
              <p className="Type--secondary">
                Documents are like love. You have got to give
                a little to get a little.
              </p>
            </div>
          </div>
        </div>
       }
    </div>
    )
  }

  tabClasses(name) {
    if (this.state.tab === name) { return 'Tabs__tab Tabs__tab--active' }
    return 'Tabs__tab'
  }

  render() {
    let body

    // XXX if notifications is empty, let's default to contacts.
    // NB: i have not implemented this, i'm just leaving a note to myself
    if (this.state.tab === 'contacts') { body = this.renderContacts() } else if (this.state.tab === 'notifications') { body = this.renderNotifications() }

    return (
      <div className="PopOverWrapper">
        <div className="ListMenu">
          <div className="Tabs">
            <div
              role="button"
              className={this.tabClasses('contacts')}
              onClick={() => this.setState({ tab: 'contacts' })}
            >
              <i className="fa fa-group" /> Contacts
            </div>
            <div
              role="button"
              className={this.tabClasses('notifications')}
              onClick={() => this.setState({ tab: 'notifications' })}
            >
              Notifications
            </div>
          </div>
          { body }
        </div>
      </div>
    )
  }
}

ContentTypes.register({
  component: Share,
  type: 'share',
  name: 'Share',
  icon: 'sticky-note',
  unlisted: 'true',
})
