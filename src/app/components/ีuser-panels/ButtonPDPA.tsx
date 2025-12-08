import { useConsent } from '@/app/contexts/pdpa';
import React from 'react'

type Props = {}

const ButtonPDPA = (props: Props) => {
  const { isAccepted, toggleConsent } = useConsent();
  return (
    <input
      type="checkbox"
      checked={isAccepted}
      onChange={(e) => {
        toggleConsent(e.target.checked)
        console.log(e.target.checked)
      }}
      className={`mt-1 w-3.5 h-3.5 sm:w-6 sm:h-6 border-gray-300 rounded text-gray-900 focus:ring-gray-900 `
      }
    />
  )
}

export default ButtonPDPA