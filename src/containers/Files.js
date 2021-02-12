import { connect } from 'react-redux'
import { showFiles, loadingFiles } from '../store/gaia/actions'
import Files from '../components/Export'

const mapStateToProps = state => {
  return {
    files: state.gaia.files,
  }
}
const mapDispatchToProps = (dispatch, redux) => {
  return {
    refreshFiles: () => {
      dispatch(loadingFiles())
      dispatch(showFiles())
    },
  }
}

const FilesContainer = connect(mapStateToProps, mapDispatchToProps)(Files)

export default FilesContainer
