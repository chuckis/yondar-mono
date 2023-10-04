import { useMemo } from 'react'
import { ModalType } from '../types/ModalType'
import { Event, nip19 } from 'nostr-tools'
import { getRelayList } from "../libraries/Nostr"
import { useGeolocationData } from "../hooks/useGeolocationData"
import { isOpenNow } from '../libraries/decodeDay'
import { DraftPlaceContextType, Place } from '../types/Place'
import { beaconToDraftPlace } from '../libraries/draftPlace'
import { CursorPositionType } from '../providers/GeolocationProvider'
import { IdentityType } from '../types/IdentityType'
import { RelayList, RelayObject } from '../types/NostrRelay'
import { MapPin } from './MapPin'

type BeaconProps = {
  currentUserPubkey: string | undefined
  ownerProfile: (Event & {content: IdentityType }) | undefined
  relays: RelayObject
  beaconData: Place
  modal: ModalType
  open: boolean,
  focusHandler: () => void
  editHandler: () => void
  draft: DraftPlaceContextType
}
export const Beacon = ({ currentUserPubkey, ownerProfile, relays, beaconData, modal, open, focusHandler, editHandler, draft }: BeaconProps) => {
  const { setDraftPlace } = draft
  const { setCursorPosition } = useGeolocationData()
  const relayList: RelayList = getRelayList(relays, ['read'])
  const picture = ownerProfile?.content?.picture

  const toggle = () => {
    if (!modal?.placeForm) {
      focusHandler()
      if (!open) {
        // we are opening the beacon details
        setCursorPosition(null)
      } else {
        // we are closing the beacon details
      }
    }
  }

  const editPlace = () => {
    editHandler()
    // set cursor to beacon's current coordinates
    const lnglat: CursorPositionType = {
      lng: beaconData.content.geometry.coordinates[0],
      lat: beaconData.content.geometry.coordinates[1]
    }
    setCursorPosition(lnglat)
    // load place data into modal 
    const newPlace = beaconToDraftPlace(beaconData, relayList)
    // set draft place
    setDraftPlace(newPlace)
    modal?.setPlaceForm('edit')
  }

  const mapMarker = useMemo( () => {
    return (
      <div className="beacon__marker" onClick={toggle}><MapPin color={`#${beaconData.pubkey.substring(0, 6)}`} image={picture || ''} /></div>
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picture, toggle])

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
      hours = <p className="hours">{
        beaconData.content.properties.hours
        ? 
          isOpenNow(beaconData.content.properties.hours)
          ? 
            <>
              "🟢 Open Now" : "💤 Not Open Right Now"
              <br />
              <small>{beaconData.content.properties.hours}</small>
            </>
          : null
        : null
      }</p>
    } catch (e) {
      // console.log('failed to parse hours', e)
    }

    let typeInfo = null
    try {
      const currentType = beaconData.content.properties.type
      if (currentType) {
        typeInfo = <p className="type">{currentType.replace(/_/g,' ')}</p>
      }
    } catch (e) {
      console.log('failed to parse type', e)
    }
    
    let statusInfo = null
    try {
      const currentStatus = beaconData.content.properties.status
      if (currentStatus !== 'OPERATIONAL' || currentStatus === undefined) {
        // don't render OPERATIONAL because it is implied
        const currentStatusColor = currentStatus === 'CLOSED_TEMPORARILY' ? 'gray' : 'red'
        const currentStatusEmoji = currentStatus === 'CLOSED_TEMPORARILY' ? '⛔' : '⛔'
        statusInfo = <p className="status" style={{ color: currentStatusColor }}>{currentStatus ? currentStatus.replace('_',' ') : null} {currentStatusEmoji}</p>
      }
    } catch (e) {
      console.log('failed to parse status', e)
    }

    let authorInfo = null
    const authorLink = nip19.npubEncode(beaconData.pubkey)
    authorInfo = <p onClick={e => e.stopPropagation()}><a href={`https://njump.me/${authorLink}`} target="_blank" rel="noopener noreferrer"><small className="ellipses">Created by {ownerProfile?.content?.displayName || ownerProfile?.content?.display_name || ownerProfile?.content?.username || beaconData.pubkey}</small></a></p>

    let edit = null
    try {
      if (currentUserPubkey === beaconData.pubkey)
        edit = <button onClick={editPlace} style={{ float: "right", marginTop: "22px", marginRight: "-1.0rem" }}>Edit</button>
    } catch (e) {
      console.log('', e)
    }

    return (
      <div className="beacon__info" onClick={toggle}>
        {beaconName}
        {typeInfo}
        {statusInfo}
        <hr/>
        {beaconDescription}
        {hours}
        {authorInfo}
        {edit}
      </div>
    )
  }

  const beaconClasses = `beacon ${open ? 'beacon--show' : ''}`

  return (
    <div className={beaconClasses}>
      {mapMarker}
      {open ? showBeaconInfo() : null}
    </div>
  )
}
