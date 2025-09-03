export type TUserTitle = {
    bgColor: string
    border: string
    color: string
    title: string
}

export type TUser = {
    accountElo: number
    countryCode: string
    gravEmail: string
    knownAliases: string[]
    pingLat: number
    pingLon: number
    uid: string
    userEmail: string // should remove
    userName: string
    userProfilePic: string
    userTitle: TUserTitle
    winstreak: number
}