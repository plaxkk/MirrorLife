import { inject } from "@vercel/analytics";

// Local previews do not serve Vercel's insights endpoint. Leaving an interior
// should not create a failed network request just by returning to the city.
const localPreview = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
if (!localPreview) {
  inject({
    mode: "auto",
    debug: false
  });
}
