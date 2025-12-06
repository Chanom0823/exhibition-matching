import PDPAPage from "@/app/pdpa/PDPAPage";
import { useContext, useState } from "react";
import ButtonPDPA from "./ButtonPDPA";
import { ActionCared, useActionCared } from "@/app/contexts/action-cared";

type props = {
  pdpa?: string;
  readPolicy?: string;
  back? : string;
  selectedLanguage? : any;
}

const UserPanelPDPA = (props: props) => {
  const { isActionCared, toggleActionCared} = useActionCared();
  return (
    <div className="flex flex-col gap-1">
      {isActionCared && <div className="w-full h-full bg-white  top-0 absolute z-1">
        <button type="button"
          onClick={() => {
            //  router.push('/pdpa')
            toggleActionCared(false)
          }}
         className="flex ml-12 relative z-5 text-xl items-center gap-2 text-gray-700 hover:text-gray-900 transition"
          >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          {props.back}
        </button>
        <PDPAPage selectedLanguage={props.selectedLanguage} />
      </div>}

      <div className="flex items-start gap-2">
        <ButtonPDPA />
        <button
          type="button"
          onClick={() => {
            //  router.push('/pdpa')
            toggleActionCared(true)
          }}
          className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 hover:underline text-left"
        >
          {props.pdpa}
        </button>
      </div>
      <p className="text-xs text-gray-500 ml-6">{props.readPolicy}</p>
    </div>
  )
}

export default UserPanelPDPA;