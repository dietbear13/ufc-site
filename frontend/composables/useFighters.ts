export const useFighters = () => {
    const fighters = ref([])

    const loadFighters = async () => {
        const data = await import('../assets/mock/fighters.json')
        fighters.value = data.default
    }

    return {
        fighters,
        loadFighters
    }
}
