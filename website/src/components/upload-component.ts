import styles from "./upload-component.module.css"

// TODO: Clicking button should have open animation.

export const UploadComponent = () => {
    return `
<section class="${styles.hero}">
    <button href="#" class="${styles.button}">upload</button>
</section>
`
}

export default UploadComponent