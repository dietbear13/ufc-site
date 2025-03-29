import { useHead } from '#app';
import { buildFighterSchema } from '../schemas/FighterSchema';
import { buildEventSchema } from '../schemas/EventSchema';
import { buildBreadcrumbSchema } from '../schemas/BreadcrumbSchema';
import type { SchemaType, FighterData, EventData, BreadcrumbItem } from '../types/schema.types';

const baseUrl = 'http://localhost:3000'; // TODO: dynamic
const schemaMap = {
    fighter: buildFighterSchema,
    event: buildEventSchema,
    breadcrumbs: buildBreadcrumbSchema,
};

export function useSeoSchemaBuilder(type: SchemaType, data: FighterData | EventData | BreadcrumbItem[]) {
    const schema = [];

    const builder = schemaMap[type];
    if (builder) {
        schema.push(builder(data as any, baseUrl));
    }

    useHead({
        script: schema.map((s) => ({
            type: 'application/ld+json',
            children: JSON.stringify(s),
        })),
    });
}
