import { publicPath, type SiteRelativePath } from "../src/lib/shared/site-contract";
const logical: SiteRelativePath = "topics/";
const finalPath = publicPath("/news/", logical);
// @ts-expect-error A final public path must not be based a second time.
publicPath("/news/", finalPath);
