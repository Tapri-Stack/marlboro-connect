import Router from "@daleighan/vanilla-js-router"
import UploadComponent from "./components/upload-component"
import GridComponent from "./components/grid-component"

const routes = {
  ["/"]: UploadComponent,
  ["/marlboro"]: GridComponent,
}

// TODO: Obfuscate with only "marlboro" or "connect" in available strings.

new Router("app", routes)
