// frontend/composables/useApi.ts

import { useState, useFetch } from '#app'

export function useApi<T = any>(url: string, options: { lazy?: boolean } = {}) {
    const key = `api:${url}`

    const state = useState<T | null>(key, () => null)

    const fetchData = async () => {
        if (!state.value) {
            const { data, error } = await useFetch<T>(`http://localhost:3001/api${url}`)
            if (error.value) throw new Error(`Ошибка при загрузке: ${error.value.message}`)
            state.value = data.value || null
        }
        return state.value
    }

    if (!options.lazy) fetchData()

    return {
        data: state,
        fetchData,
    }
}
