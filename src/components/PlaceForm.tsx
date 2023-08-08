import React, { useContext } from 'react'
import { useGeolocationData } from '../hooks/useGeolocationData'
import { typeDropdown, DraftPlace, GooglePlaceType, GooglePlaceStatus, requiredProperties } from '../types/Place'
import { IdentityContext, IdentityContextType } from '../providers/IdentityProvider'
import { FancyButton } from './FancyButton'
import { nip19 } from 'nostr-tools'
import '../scss/PlaceForm.scss'
import { defaultRelays } from '../libraries/Nostr'

/* create a tsx form to handle input for a new place based on the examplePlace: 
const examplePlace = `
{
  "kind": 37515,
  "tags": [
    [ "d", "North Dakota Heritage Center & State Museum" ],
    [ "g", "cb266epj" ],
    [ "alt", "This event represents a place. View it on go.yondar.me/${exampleNaddr}" ]
  ],
  "content": {
    "type": "Feature",
    "properties": {
      "name": "North Dakota Heritage Center & State Museum",
      "abbrev": "Heritage Center",
      "description": "State history museum offering exhibits on the state's geologic prehistory, early peoples & culture.",
      "address": {
        "street-address": "612 E Boulevard Ave",
        "locality": "Bismarck",
        "region": "North Dakota",
        "country-name": "United States",
        "postal-code": "58505"
      },
      "type": "museum",
      "status": "OPERATIONAL",
      "website": "https://statemuseum.nd.gov/",
      "phone": "+1-701-328-2666",
      "hours": "Mo-Fr 08:00-17:00; Sa-Su 10:00-17:00"
    },
    "geometry": {
      "coordinates": [
        -100.77873491903246,
        46.81915362955226
      ],
      "type": "Point"
    }
  }
}`
*/

type PlaceFormProps = {
  edit?: boolean
}

export const PlaceForm: React.FC<PlaceFormProps> = ({edit = false}) => {
  const {identity} = useContext<IdentityContextType>(IdentityContext)
  const { cursorPosition } = useGeolocationData()

  // create a form to handle input for a new place based on the examplePlace. Do not take JSON - this form should be user-friendly.
  // use the following form fields:
  // name, abbrev, description, address, type, status, website, phone, hours
  // use the following HTML elements:
  // input, textarea, select, option, button
  // use the following React hooks:
  // useState, useEffect

  // refs for all fields 
  const nameRef = React.createRef<HTMLInputElement>()
  const abbrevRef = React.createRef<HTMLInputElement>()
  const descriptionRef = React.createRef<HTMLTextAreaElement>()
  const streetAddressRef = React.createRef<HTMLInputElement>()
  const localityRef = React.createRef<HTMLInputElement>()
  const regionRef = React.createRef<HTMLInputElement>()
  const countryNameRef = React.createRef<HTMLInputElement>()
  const postalCodeRef = React.createRef<HTMLInputElement>()
  const typeRef = React.createRef<HTMLSelectElement>()
  const statusRef = React.createRef<HTMLSelectElement>()
  const websiteRef = React.createRef<HTMLInputElement>()
  const phoneRef = React.createRef<HTMLInputElement>()

  // get naddr
  const naddr = nip19.naddrEncode({
    pubkey: identity.pubkey,
    relays: defaultRelays,
    kind: 37515,
    identifier: nameRef.current?.value || ""
  })

  // TODO: get geohash from coordinates from latlong-geohash library
  //
  const geohash = "TODO" 

  const publish = () => {
    // create an event from the form data conforming to the type DraftPlace
    if (!nameRef.current?.value) return // name is required
    if (!cursorPosition) return // this should never happen

    const newPlace: DraftPlace = {
      kind: 37515,
      tags: [
        [ "d", nameRef.current?.value ],
        [ "g", geohash ],
        [ "alt", `This event represents a place. View it on https://go.yondar.me/place/${naddr}` ]
      ],
      content: {
        type: "Feature",
        geometry: {
          coordinates: [
            cursorPosition.lng,
            cursorPosition.lat
          ],
          type: "Point"
        },
        properties: {
          name: nameRef.current?.value || "",
          abbrev: abbrevRef.current?.value || "",
          description: descriptionRef.current?.value || "",
          address: {
            "street-address": streetAddressRef.current?.value || "",
            locality: localityRef.current?.value || "",
            region: regionRef.current?.value || "",
            "country-name": countryNameRef.current?.value || "",
            "postal-code": postalCodeRef.current?.value || "",
          },
          type: (typeRef.current?.value || "") as GooglePlaceType,
          status: (statusRef.current?.value || "") as GooglePlaceStatus,
          website: websiteRef.current?.value || "",
          phone: phoneRef.current?.value || "",
        },
      }
    }

    // eliminate empty optional fields
    Object.keys(newPlace.content.properties).forEach(key => {
      if (!requiredProperties.includes(key) && newPlace.content.properties[key] === "") {
        delete newPlace.content.properties[key]
      }
    })

    // TODO: serialize content property


  }

  return (
    <div id="component-placeform">
      <h1>{ edit ? "Edit your" : "Add a" } Place 📍</h1>
      { edit ? null : <p>Places can be edited later! They are replaceable events.</p> }
      <label htmlFor="name">Name</label>
      <input required={true} id="name" ref={nameRef} type="text" placeholder="Name of this Place" />
      <label htmlFor="abbrev">Abbreviation</label>
      <input id="abbrev" ref={abbrevRef} type="text" placeholder="Abbreviated (short) name" />
      <label htmlFor="description">Description</label>
      <textarea id="description" ref={descriptionRef} placeholder="A couple sentences to decribe the Place"></textarea>
      <label htmlFor="address"><h2>Address Information<br/><small>(optional)</small></h2></label>
      <fieldset id="address">
        <label htmlFor="street-address">Street Address</label>
        <input id="street-address" ref={streetAddressRef} type="text" placeholder="Street Address" />
        <label htmlFor="locality">City</label>
        <input id="locality" ref={localityRef} type="text" placeholder="City" />
        <label htmlFor="region">State</label>
        <input id="region" ref={regionRef} type="text" placeholder="State" />
        <label htmlFor="country-name">Country</label>
        <input id="country-name" ref={countryNameRef} type="text" placeholder="Country" />
        <label htmlFor="postal-code">Postal Code</label>
        <input id="postal-code" ref={postalCodeRef} type="text" placeholder="Postal Code" />
      </fieldset>
      <label htmlFor="type">Type</label>
      { typeDropdown(typeRef) }
      <label htmlFor="status">Status</label>
      <select id="status" ref={statusRef}>
        <option value="OPERATIONAL">Operational</option>
        <option value="CLOSED_TEMPORARILY">Closed Temporarily</option>
        <option value="CLOSED_PERMANENTLY">Closed Permanently</option>
      </select>
      <label htmlFor="website">Website</label>
      <input id="website" ref={websiteRef} type="text" placeholder="https://yondar.me" />
      <label htmlFor="phone">Phone</label>
      <input id="phone" ref={phoneRef} type="text" placeholder="+1 123 456 7890" />
      <br/>
      <FancyButton size={"lg"} onClick={publish}>
        { edit ? "Edit" : "Publish" } Place
      </FancyButton>
      <br/>
      <br/>
    </div>
  )
}