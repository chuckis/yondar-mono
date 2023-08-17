import { useState, useEffect, useReducer } from 'react'
import { Event, Filter } from 'nostr-tools'
import { defaultRelays, pool } from "../libraries/Nostr"
import { useGeolocation } from '../hooks/useGeolocation'
import { useMap } from 'react-map-gl'
import { BeaconCollection } from "../types/Beacon"
import { Marker } from 'react-map-gl'
import '../scss//MapPlaces.scss'
import { isOpenNow } from '../libraries/decodeDay'

type MapPlacesProps = {
  children?: React.ReactNode
}

const beaconsReducer = (state, action) => {
  switch(action.type) {
    case 'add': 
      return {
        ...state,
        [action.beacon.id]: action.beacon  
      }
    default:
      return state
  }
}

export const MapPlaces = ({ children }: MapPlacesProps) => {
  const [beacons, beaconsDispatch] = useReducer(beaconsReducer, {})
  const { position } = useGeolocation()
  const {current: map} = useMap()


  useEffect( () => {
    const filter: Filter = {kinds: [37515]}
    const sub = pool.sub(defaultRelays, [filter])
    sub.on('event', (event) => {
      try {
        event.content = JSON.parse(event.content)
        // console.log('found beacon', event.tags[0][1])
        if (!event.content.geometry || !event.content.geometry.coordinates) throw new Error('No coordinates')
        beaconsDispatch({
          type: 'add',
          beacon: event
        })
      } catch (e) {
        // console.log('Failed to parse event content:', e)
      }
    })
  }, [])

  return Object.values(beacons).map( (beacon) => {
    const handleFollow = () => {
      if (map && position) {
        map.flyTo({
          center: [beacon.content.geometry.coordinates[0] + 0.0015, beacon.content.geometry.coordinates[1]],
          zoom: 16,
          duration: 1000,
        })
      }
    }
    return (
      <Marker key={beacon.id} longitude={beacon.content.geometry.coordinates[0]} latitude={beacon.content.geometry.coordinates[1]} offset={[-20,-52]} anchor={'center'}>
        <Beacon beaconData={beacon} clickHandler={handleFollow}/>
      </Marker>
    )
  })
}

type BeaconProps = {
  beaconData: Event,
  clickHandler: () => void
}

const Beacon = ({beaconData, clickHandler}: BeaconProps) => {
  const [show, setShow] = useState<boolean>(false)
  const [beaconProfilePicture, setBeaconProfilePicture] = useState<string>('')
  const toggle = () => {
    if (!show) clickHandler()
    setShow(!show)
  }

  useEffect( () => {
    // get profile for beacon owner (pubkey) by querying for most recent kind 0 (profile)
    const filter: Filter = {kinds: [0], authors: [beaconData.pubkey]}
    const profileSub = pool.sub(defaultRelays, [filter])
    profileSub.on('event', (event) => {
      // this will return the most recent profile event for the beacon owner; only the most recent is stored as specified in NIP-01
      try {
        const profile = JSON.parse(event.content)
        setBeaconProfilePicture(profile.picture)
      } catch (e) {
        console.log('Failed to parse event content:', e)
      }
    })
  }, [])

  const mapMarker = <div className="beacon__marker">{<MapPin color={`#${beaconData.pubkey.substring(0,6)}`} image={beaconProfilePicture}/>}</div>

  const showBeaconInfo = () => {

    let beaconName = null
    try {
      beaconName = <h2>{beaconData.content.properties.name}</h2>
    } catch (e) {
      console.log('failed to parse name', e)
    }

    let beaconDescription = null
    try {
      beaconDescription = <p>{beaconData.content.properties.description}</p>
    } catch (e) {
      console.log('failed to parse description', e)
    }

    let hours = null
    try {
      hours = <p className="hours">{ isOpenNow(beaconData.content.properties.hours) ? "🟢 Open Now" : "⛔ Not Open Right Now"}<br/><small>{beaconData.content.properties.hours}</small></p>
    } catch (e) {
      console.log('failed to parse hours', e)
    }

    return (
      <div className="beacon__info">
        {beaconName}
        {beaconDescription}
        {hours}
      </div>
    )
  }

  return (
      <div className="beacon" onClick={toggle}>
        {mapMarker}
        { show ? showBeaconInfo() : null }
      </div>
  )
}

const MapPin = ({ color, image }) => (
  <svg width="40" height="60" viewBox="0 0 40 60">
    
    <defs>
      <mask id="pinMask">
        <rect x="0" y="0" width="40" height="60" fill="black"/>
        <circle cx="20" cy="20" r="15" fill="white"/>
      </mask>
    </defs>

    <path 
      fill={color}
      d="M20 8c-7.732 0-14 6.268-14 14 0 15.464 14 30 14 30s14-14.536 14-30c0-7.732-6.268-14-14-14z"
    />

    <image
      x="5" y="5" width="30" height="30"
      preserveAspectRatio="xMidYMid slice"  
      xlinkHref={image}
      mask="url(#pinMask)"
    />

  </svg>
)