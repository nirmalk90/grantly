import raw from '../../public/data/scholarships.json';
import { parseCatalog } from '../services/catalog';
import type { CatalogRepository } from '../services/catalog';
export const testCatalog = parseCatalog(raw);
export const testScholarships = testCatalog.scholarships;
export const testRepository: CatalogRepository = { load: () => Promise.resolve(testCatalog) };
