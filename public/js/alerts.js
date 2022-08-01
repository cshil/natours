// type is 'success' or 'error'

export const hideAlert = () => {
    const el = document.querySelector('.alert');
    //Move to parent element and remove the child
    if (el) el.parentElement.removeChild(el);
}


export const showAlert = (type, msg) => {
    hideAlert();
    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    console.log(markup);
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
    window.setTimeout(hideAlert, 5000);
} 