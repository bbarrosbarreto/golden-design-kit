import {
  groupImagesByCategory,
  normalizePropImages,
  pickPropCover,
} from "@/lib/property-images";

export const SITE_URL = "https://brunobarretoimoveis.com.br";

export type SchemaProperty = {
  title: string;
  slug: string;
  description?: string | null;
  type?: string | null;
  purpose?: string | null;
  price?: number | null;
  address?: string | null;
  area?: number | null;
  built_area?: number | null;
  useful_area?: number | null;
  bedrooms?: number | null;
  suites?: number | null;
  bathrooms?: number | null;
  parking_spots?: number | null;
  features?: unknown;
  status?: string | null;
  published_at?: string | null;
  images?: unknown;
  image_category_order?: unknown;
  regions?: { name: string } | null;
};

const MAIN_ENTITY_TYPE: Record<string, string> = {
  apartamento: "Apartment",
  cobertura: "Apartment",
  casa: "SingleFamilyResidence",
  casa_condominio: "SingleFamilyResidence",
};

const AVAILABILITY: Record<string, string> = {
  disponivel: "https://schema.org/InStock",
  vendido: "https://schema.org/OutOfStock",
  reservado: "https://schema.org/OutOfStock",
};

const BUSINESS_FUNCTION: Record<string, string> = {
  venda: "http://purl.org/goodrelations/v1#Sell",
  aluguel: "http://purl.org/goodrelations/v1#LeaseOut",
};

type Json = Record<string, unknown>;

/** Remove chaves nulas/vazias (mantém `false` e `0` só quando explicitamente passado). */
function compact(obj: Json): Json {
  const out: Json = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "object" && !Array.isArray(v) && Object.keys(v as Json).length <= 1) {
      // objetos que só têm "@type" não agregam nada
      continue;
    }
    out[k] = v;
  }
  return out;
}

function positive(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function listingImages(prop: SchemaProperty): string[] {
  const all = normalizePropImages(prop.images, prop.type);
  if (all.length === 0) return [];
  const cover = pickPropCover(prop.images, prop.type);
  const groups = groupImagesByCategory(all, prop.type, prop.image_category_order);
  const ordered: string[] = [];
  if (cover?.url) ordered.push(cover.url);
  for (const g of groups) {
    for (const img of g.images) {
      if (img.url && !ordered.includes(img.url)) ordered.push(img.url);
    }
  }
  for (const img of all) {
    if (img.url && !ordered.includes(img.url)) ordered.push(img.url);
  }
  return ordered.slice(0, 10);
}

function amenityFeatures(prop: SchemaProperty) {
  const list: Json[] = [];
  const features = Array.isArray(prop.features) ? prop.features : [];
  for (const f of features) {
    if (typeof f === "string" && f.trim()) {
      list.push({
        "@type": "LocationFeatureSpecification",
        name: f.trim(),
        value: true,
      });
    }
  }
  const spots = positive(prop.parking_spots);
  if (spots !== undefined) {
    list.push({
      "@type": "LocationFeatureSpecification",
      name: "Vagas de garagem",
      value: spots,
    });
  }
  const suites = positive(prop.suites);
  if (suites !== undefined) {
    list.push({
      "@type": "LocationFeatureSpecification",
      name: "Suítes",
      value: suites,
    });
  }
  return list;
}

function buildAddress(prop: SchemaProperty): Json | undefined {
  const address = compact({
    "@type": "PostalAddress",
    streetAddress: prop.address ?? undefined,
    addressLocality: prop.regions?.name ?? undefined,
    addressRegion: "DF",
    addressCountry: "BR",
  });
  // Sem rua nem região, o bloco não agrega — só sobram os fixos.
  if (!prop.address && !prop.regions?.name) return undefined;
  return address;
}

function buildMainEntity(prop: SchemaProperty): Json | undefined {
  const schemaType = prop.type ? MAIN_ENTITY_TYPE[prop.type] : undefined;
  if (!schemaType) return undefined;

  const floorValue =
    positive(prop.built_area) ?? positive(prop.useful_area) ?? positive(prop.area);
  const bedrooms = positive(prop.bedrooms);
  const bathrooms = positive(prop.bathrooms);
  const amenities = amenityFeatures(prop);

  const entity: Json = {
    "@type": schemaType,
    name: prop.title,
  };
  if (bedrooms !== undefined) {
    entity.numberOfBedrooms = bedrooms;
    entity.numberOfRooms = bedrooms;
  }
  if (bathrooms !== undefined) entity.numberOfBathroomsTotal = bathrooms;
  if (floorValue !== undefined) {
    entity.floorSize = {
      "@type": "QuantitativeValue",
      value: floorValue,
      unitCode: "MTK",
    };
  }
  const address = buildAddress(prop);
  if (address) entity.address = address;
  if (amenities.length > 0) entity.amenityFeature = amenities;

  return entity;
}

function buildOffers(prop: SchemaProperty): Json | undefined {
  const price = positive(prop.price);
  const availability = prop.status ? AVAILABILITY[prop.status] : undefined;
  const businessFunction = prop.purpose ? BUSINESS_FUNCTION[prop.purpose] : undefined;

  if (price === undefined && !availability && !businessFunction) return undefined;

  const offer: Json = { "@type": "Offer", priceCurrency: "BRL" };
  if (price !== undefined) offer.price = price;
  if (availability) offer.availability = availability;
  if (businessFunction) offer.businessFunction = businessFunction;
  offer.seller = {
    "@type": "RealEstateAgent",
    name: "Bruno Barreto Imóveis",
    telephone: "+5561999350888",
    identifier: "CRECI-DF 34060",
    areaServed: "Distrito Federal, Brasil",
  };
  return offer;
}

export function buildListingSchema(prop: SchemaProperty, description: string): Json {
  const url = `${SITE_URL}/imoveis/${prop.slug}`;
  const images = listingImages(prop);
  const offers = buildOffers(prop);
  const mainEntity = buildMainEntity(prop);

  const listing: Json = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: prop.title,
    description,
    url,
  };
  if (prop.published_at) listing.datePosted = prop.published_at;
  if (images.length > 0) listing.image = images;
  if (offers) listing.offers = offers;
  if (mainEntity) listing.mainEntity = mainEntity;

  return listing;
}

export function buildBreadcrumbSchema(prop: { title: string; slug: string }): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Imóveis", item: `${SITE_URL}/imoveis` },
      {
        "@type": "ListItem",
        position: 3,
        name: prop.title,
        item: `${SITE_URL}/imoveis/${prop.slug}`,
      },
    ],
  };
}
