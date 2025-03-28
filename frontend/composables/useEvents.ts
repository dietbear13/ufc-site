// frontend/composables/useEvents.ts
import { useApi } from './useApi'

export const useEvents = () => {
    const { data: events, fetchData: loadEvents } = useApi('/events')

    return {
        events,
        loadEvents,
    }
}
