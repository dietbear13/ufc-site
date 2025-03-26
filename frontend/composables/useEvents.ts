export const useEvents = () => {
    const events = ref([])

    const loadEvents = async () => {
        const data = await import('../assets/mock/events.json')
        events.value = data.default
    }

    return {
        events,
        loadEvents
    }
}
