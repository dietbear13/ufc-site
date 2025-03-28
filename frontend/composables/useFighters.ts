// frontend/composables/useFighters.ts
import { useApi } from './useApi'

export const useFighters = () => {
    const { data: fighters, fetchData: loadFighters } = useApi('/fighters')

    return {
        fighters,
        loadFighters,
    }
}
