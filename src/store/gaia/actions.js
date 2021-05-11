import { SHOW_FILES, SET_FILES } from '../ActionTypes'
import { getBucketUrl } from '@stacks/storage'

function showFilesScreen(show) {
  return { type: SHOW_FILES, payload: { show } }
}

function newFile(files, f) {
  console.log('received ', f)
  if (f.endsWith('Contacts')) {
    files.contactListFile = files.appBucketUrl + f
  } else if (f.endsWith('Calendars')) {
    files.calendarListFile = files.appBucketUrl + f
  } else if (f.endsWith('public/AllEvents')) {
    files.calendars.public[0].url = files.appBucketUrl + f
  } else if (f.endsWith('public/AllEvents.ics')) {
    files.calendars.public[0].ics = files.appBucketUrl + f
  } else if (f.endsWith('default/AllEvents')) {
    files.calendars.private = [{ name: 'private', url: files.appBucketUrl + f }]
  } else if (f.endsWith('event.json') && f.startsWith('shared/')) {
    files.sharedEvents.push({ name: f, url: files.appBucketUrl + f })
  } else if (f.startsWith('msg/')) {
    if (!files.msgs) {
      files.msgs = []
    }
    files.msgs.push({ name: f, url: files.appBucketUrl + f })
  } else {
    files.others.push({ name: f, url: files.appBucketUrl + f })
  }
}

function setFiles(files, count) {
  return { type: SET_FILES, payload: { files, count } }
}

export function loadingFiles() {
  return (dispatch, getState) => {
    initFiles(getState().auth.user).then(files => dispatch(setFiles(files, 0)))
  }
}

function initFiles(user) {
  return getBucketUrl(user.hubUrl, user.appPrivateKey).then(url => {
    const files = {
      appBucketUrl: url,
      calendars: {
        public: [{ name: 'public' }],
      },
      others: [],
      sharedEvents: [],
    }
    return files
  })
}

export function showFiles() {
  return (dispatch, getState) => {
    const { userSession } = getState().auth
    dispatch(showFilesScreen(true))
    initFiles(getState().auth.user).then(files =>
      userSession
        .listFiles(f => {
          newFile(files, f)
          return true
        })
        .then(count => {
          dispatch(setFiles(files, count))
        })
    )
  }
}
