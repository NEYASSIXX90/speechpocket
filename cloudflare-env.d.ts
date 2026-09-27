declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    RATE_LIMIT_SALT?: string;
    BUCKET?: R2Bucket;
  }
}
