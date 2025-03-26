// composables/useSeoHead.ts
export const useSeoHead = ({
                               title,
                               description,
                               canonical
                           }: {
    title: string
    description?: string
    canonical?: string
}) => {
    useHead({
        title,
        meta: [
            { name: 'description', content: description || title },
            { property: 'og:title', content: title },
            { property: 'og:description', content: description || title }
        ],
        link: canonical
            ? [{ rel: 'canonical', href: canonical }]
            : []
    })
}
