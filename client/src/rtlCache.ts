import createCache from "@emotion/cache";
import rtlPlugin from "@mui/stylis-plugin-rtl";

const rtlCache = createCache({
  key: "mui-rtl",
  stylisPlugins: [rtlPlugin],
  prepend: true, 
});

export default rtlCache;
