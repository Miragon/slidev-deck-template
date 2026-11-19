import MiragonTheme from "../miragon/theme"
import HomeLanding from "./HomeLanding.vue"
import "./custom.css"

export default {
  extends: MiragonTheme,
  enhanceApp({ app }) {
    app.component("HomeLanding", HomeLanding)
  },
}
