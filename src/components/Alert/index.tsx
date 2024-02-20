
export default function Alert({ centered = true, title, body }: AlertProps) {


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
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Got it</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AlertProps {
  title: string,
  body: string,
  centered?: boolean,
};