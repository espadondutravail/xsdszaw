import { z } from "zod";

const Base = z.object({
  name: z.string().min(2).trim(),
  thumbnailAssetId: z.string(),
  email: z.string().email().trim(),
  website: z.union([z.string().url().trim().optional(), z.literal("")]),
  description: z.string().trim().min(10),
});

const TemplatesProduct = Base.extend({
  category: z.literal("templates"),
});

// Will add an AppProduct later.
export const MarketplaceProduct = TemplatesProduct;
export type MarketplaceProduct = z.infer<typeof MarketplaceProduct>;
