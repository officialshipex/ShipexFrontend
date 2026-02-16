import React from 'react'  
import PropTypes from 'prop-types'
function Finish({ handleSubmit }) {
    return (<>
      <div className="text-center">
        <p className="text-lg font-semibold">
          All sections complete!
        </p>
        <button
          className="mt-4 px-6 py-2 text-white bg-[#0CBB7D] hover:bg-[#0CBB7D] rounded-lg shadow-sm"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </>)
  }
  
  Finish.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
  }
  export default Finish