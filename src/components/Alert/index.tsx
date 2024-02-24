
export default function Alert({ centered = true, title, body, customButton }: AlertProps) {

  const renderCustomButton = () => {
    if (!customButton) return;

    const buttonColor = customButton["buttonColor"] ? customButton["buttonColor"] : "";
    const buttonText = customButton["buttonText"] ? customButton["buttonText"] : "Got it";
    const onClickAction = customButton["onClickAction"] ? customButton["onClickAction"] : () => { };

    return (
      <>
        <button type="button" className={`btn btn-secondary me-2`} data-bs-dismiss="modal">Cancel</button>
        <button type="button" className={`btn ${buttonColor || "btn-secondary"} ms-2`} data-bs-dismiss="modal" onClick={() => onClickAction()}>{buttonText}</button>
      </>
    )
  }

  return (
    <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 9999 }}>
      <div className="modal fade" id="alertModal" tabIndex={-1} aria-labelledby="alertModalLabel" aria-hidden="true">
        <div className={`${centered ? "modal-dialog modal-dialog-centered" : "modal-dialog"}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
            </div>
            {!body ? null :
              <div className="modal-body custom-modal-body">
                <p className="modal-title text-center fs-5">
                  {body}
                </p>
              </div>
            }
            <div className="modal-body text-end">
              {customButton ?
                renderCustomButton() :
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">"Got it"</button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AlertProps {
  centered?: boolean;
  title: string;
  body: string;
  customButton?: CustomButton;
}

interface CustomButton {
  buttonColor?: string;
  buttonText?: string;
  onClickAction?: VoidFunction;
}