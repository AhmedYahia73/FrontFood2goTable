import React from 'react'
import { PulseLoader } from 'react-spinners'

const StaticSpinner = () => {
       return (
              <>
                     <div className='w-full h-full flex justify-center items-center'>
                            <PulseLoader color='var(--color-main)' size={20} />
                     </div>
              </>
       )
}

export default StaticSpinner