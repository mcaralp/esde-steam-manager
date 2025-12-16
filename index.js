#!/usr/bin/env node
import axios from 'axios'
import Fuse from 'fuse.js'

async function searchSteam(name)
{
    const url = 'https://store.steampowered.com/api/storesearch/'
    
    const res = await axios.get(url, {
        params: {
            term: name,
            l: 'en',
            cc: 'us'
        }
    })

    const json = res.data

    if (!json.items || json.items.length === 0) 
    {
        throw new Error('No results found.')
    }

    const titles = json.items.map(item => item.name)

    const fuse = new Fuse(titles)
    const results = fuse.search(name)

    console.log(`Found ${json.items.length} results:\n`)
    json.items.forEach(item => 
    {
        console.log(`ID: ${item.id.toString().padStart(7, ' ')} - Title: ${item.name}`)
    })

    return json.items[results[0].refIndex].id
}

async function getAppDetails(appid, lang) 
{
    const url = 'https://store.steampowered.com/api/appdetails'
    const res = await axios.get(url, {
        params: {
            appids: appid,
            l: lang,
            cc: 'us'
        }
    })
    const json = res.data

    if (!json[appid]?.success) 
    {
        errorExit('Game not found or not accessible')
    }
    return json[appid].data
}

async function getReviews(appid) 
{
    const url = `https://store.steampowered.com/appreviews/${appid}`
    const res = await axios.get(url, {
        params: {
            json: 1,
            count: 1,
            l: 'en'
        }
    })
    return res.data
}

async function main() 
{

    if (process.argv.length < 3)
    {
        console.error('Usage: node steam_game_info.js <name> [language]')
        process.exit(1)
    }
    const search = process.argv[2]
    const lang = process.argv[3] || 'en'
    const appid = await searchSteam(search)

    const details = await getAppDetails(appid, lang)
    const reviewsData = await getReviews(appid)

    const name = details.name
    const hasMulti = details.categories?.find(c => c.id === 1) !== undefined
    const date = details.release_date.coming_soon ? 'Coming Soon' : new Date(details.release_date.date).toISOString().split('T')[0]
    const developers = details.developers?.join(', ')
    const publishers = details.publishers?.join(', ')
    const short_description = details.short_description
    const genres = details.genres?.map(g => g.description).join(', ')
    const score = Math.round(reviewsData.query_summary?.review_score) / 2

    const screenshots = details.screenshots?.map(s => s.path_full) || []
    const movies = details.movies?.map(m => m.id) || []

    const logo = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/logo_2x.png`
    const capsule = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/library_600x900_2x.jpg`
    const movie = `https://video.fastly.steamstatic.com/store_trailers/${movies[0]}/movie480.mp4`

    console.log(`Title: ${name}`)
    console.log(`Release Date: ${date}`)
    console.log(`Developers: ${developers}`)
    console.log(`Publishers: ${publishers}`)
    console.log(`Genres: ${genres}`)
    console.log(`Has Multiplayer: ${hasMulti ? 'Yes' : 'No'}`)
    console.log(`Steam Rating: ${score}`)
    console.log(`Short Description: ${short_description}`)
    console.log(`Logo URL: ${logo}`)
    console.log(`Capsule URL: ${capsule}`)
    console.log(`Screenshot: ${screenshots[0]}`)
    console.log(`Movie: ${movie}`)

//     const result = {
//         appid,
//         name: details.name,

//         short_description: stripHtml(details.short_description),
//         full_description: stripHtml(details.detailed_description),

//         release_date: details.release_date?.date,
//         publishers: details.publishers,
//         developers: details.developers,

//         age_limit: details.required_age,

//         players,

//         steam_rating: {
//             score: reviewsData.query_summary?.review_score,
//             description: reviewsData.query_summary?.review_score_desc,
//             total_reviews: reviewsData.query_summary?.total_reviews
//         },

//         user_reviews_sample: reviewsData.reviews?.map(r => ({
//             recommended: r.voted_up,
//             playtime_hours: Math.round(r.author.playtime_forever / 60),
//             helpful_votes: r.votes_up,
//             text: r.review.trim(),
//             date: new Date(r.timestamp_created * 1000).toISOString()
//         })),

//         logo: details.header_image,

//         capsules: {
//             large: `https://cdn.cloudflare.steampowered.com/steam/apps/${appid}/library_600x900.jpg`,
//             small: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_300x450.jpg`
//         },

// //         videos: details.movies?.map(m => ({
// //             name: m.name,
// //             thumbnail: m.thumbnail,
// //             mp4_480: m.mp4['480'],
// //             mp4_max: m.mp4['max']
// //         })),

//         screenshots: details.screenshots?.map(s => ({
//             full: s.path_full,
//             thumb: s.path_thumbnail
//         }))
//     }

//     console.log(JSON.stringify(result, null, 2))
}

main()