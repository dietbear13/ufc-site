// frontend/composables/useApi.ts

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface UseApiOptions<T> {
    method?: HttpMethod
    body?: any
    params?: Record<string, string | number>
    headers?: HeadersInit
    lazy?: boolean
    immediate?: boolean
    cacheKey?: string
    transform?: (data: any) => T
}

export function useApi<T = any>(
    url: string,
    options: UseApiOptions<T> = {}
) {
    const baseUrl = 'http://localhost:3001/api'
    const fullUrl = computed(() => {
        const paramString = options.params
            ? '?' + new URLSearchParams(options.params as any).toString()
            : ''
        return `${baseUrl}${url}${paramString}`
    })

    const key = options.cacheKey || `api:${url}`
    const state = useState<T | null>(key, () => null)

    const fetchData = async () => {
        const { data, error } = await useFetch<T>(fullUrl.value, {
            method: options.method as any || 'GET',
            body: options.body,
            headers: options.headers,
        })

        if (error.value) {
            throw createError({ statusCode: 500, statusMessage: error.value.message })
        }

        state.value = options.transform
            ? options.transform(data.value as T)
            : (data.value as T)
        return state.value
    }

    if (process.client && options.immediate !== false && !options.lazy && !state.value) {
        fetchData()
    }

    return {
        data: state,
        refresh: fetchData,
        set: (val: T) => (state.value = val),
    }
}
