// This is also used on the backend to parse data. Slightly modified export style.

function parseMatchData(rawData = '') {
    if (typeof rawData !== 'string' || !rawData.trim().length) return {}

    try {
        const parsed = JSON.parse(rawData)
        if (parsed && typeof parsed === 'object') {
            return parsed
        }
    } catch (err) {
        console.warn('Failed to parse match JSON, falling back to legacy format')
    }

    const result = {}
    const lines = rawData
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

    for (const line of lines) {
        const [key, value = ''] = line.split(':')
        if (!key) continue
        const trimmedValue = value.trim()
        let parsedValue
        if (!trimmedValue.length) {
            parsedValue = trimmedValue
        } else if (trimmedValue.toLowerCase() === 'true') {
            parsedValue = true
        } else if (trimmedValue.toLowerCase() === 'false') {
            parsedValue = false
        } else {
            const numericValue = Number(trimmedValue)
            parsedValue = Number.isNaN(numericValue) ? trimmedValue : numericValue
        }

        if (result[key]) {
            if (!Array.isArray(result[key])) {
                result[key] = [result[key]]
            }
            result[key].push(parsedValue)
        } else {
            result[key] = parsedValue
        }
    }

    return result
}

function getCharacterByCode(characterCode) {
    switch (parseInt(characterCode)) {
        case 1:
            return 'Alex'
            break
        case 2:
            return 'Ryu'
            break
        case 3:
            return 'Yun'
            break
        case 4:
            return 'Dudley'
            break
        case 5:
            return 'Necro'
            break
        case 6:
            return 'Hugo'
            break
        case 7:
            return 'Ibuki'
            break
        case 8:
            return 'Elena'
            break
        case 9:
            return 'Oro'
            break
        case 10:
            return 'Yang'
            break
        case 11:
            return 'Ken'
            break
        case 12:
            return 'Sean'
            break
        case 13:
            return 'Urien'
            break
        case 14:
            return 'Gouki'
            break
        case 16:
            return 'Chun-Li'
            break
        case 17:
            return 'Makoto'
            break
        case 18:
            return 'Q'
            break
        case 19:
            return 'Twelve'
            break
        case 20:
            return 'Remy'
            break
        default:
            return 'Remy'
            break
    }
}

export { parseMatchData, getCharacterByCode }
