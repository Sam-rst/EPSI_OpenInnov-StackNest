export interface CatalogItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  provider: string;
  tags: ReadonlyArray<string>;
  desc: string;
  popular?: boolean;
}
