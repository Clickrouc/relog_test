import React, {useState, useEffect, useRef} from "react";
import axios from "axios";
import {FixedSizeList as List} from "react-window";
import {MapContainer, TileLayer, Marker, Popup} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";

function App() {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listHeight, setListHeight] = useState(400);
    const [listWidth, setListWidth] = useState(320);
    const [selectedID, setSelectedID] = useState("");
    const [map, setMap] = useState(null);
    const listRef = useRef(null);

    const types = {
        pickup: "Грузовая перевозка",
        delivery: "Доставка"
    }

    function createIcon(image) {
        return L.icon({
            iconUrl: image,
            iconSize: [32,32],
            iconAnchor: [16, 16],
            popupAnchor: [0, 0],
            shadowUrl: null,
            shadowSize: null,
            shadowAnchor: null
        });
    }

    function getMarkerIcon(index) {
        if(index === selectedID) {
            return createIcon("data:image/svg+xml,%3Csvg width='26' height='26' viewBox='0 0 26 26' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle opacity='0.8' cx='12.7792' cy='12.7792' r='12.7792' fill='%23BD9847'/%3E%3Ccircle opacity='0.4' cx='12.7792' cy='12.7793' r='8.90674' fill='black'/%3E%3Ccircle cx='12.7792' cy='12.7793' r='5.03424' fill='black'/%3E%3C/svg%3E%0A");
        }

        return createIcon("data:image/svg+xml,%3Csvg width='26' height='26' viewBox='0 0 26 26' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle opacity='0.8' cx='12.7792' cy='12.7792' r='12.7792' fill='%23BD9847'/%3E%3Ccircle opacity='0.4' cx='12.7792' cy='12.7793' r='8.90674' fill='black'/%3E%3Ccircle cx='12.7792' cy='12.7793' r='5.03424' fill='%23D5B36A'/%3E%3C/svg%3E%0A");
    }

    function prepareData(apps, clients) {
        let clientsMap = {};

        clients.forEach((client) => {
            clientsMap[client.id] = client;
        });

        apps.forEach((app) => {
            app.client = clientsMap[app["client_id"]];
        });

        setApps(apps);
    }

    function clickHandler(data, index) {
        setSelectedID(data.id);
        listRef.current.scrollToItem(index, "center");
        map.setView([data.coords.lat, data.coords.long], 18);
    }

    useEffect(() => {
        function handleResize() {
            const width = document.body.offsetWidth;

            if (width < 1024) {
                setListWidth(document.body.offsetWidth);
            } else {
                setListWidth(400);
                setListHeight(600);
            }
        }

        handleResize();

        window.addEventListener("resize", handleResize);

        const apps = axios.get("http://localhost:3000/apps");
        const clients = axios.get("http://localhost:3000/clients");

        axios.all([apps, clients])
            .then(axios.spread((...responses) => {
                prepareData(responses[0].data, responses[1].data)
            }))
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <div className="app">
            <div className="container">
                { loading ? <div className="loading"><div className="loading__spinner" /></div> : null }

                <div className="list">
                    <List
                        ref={listRef}
                        className="list__container"
                        itemData={apps}
                        width={listWidth}
                        height={listHeight}
                        itemCount={apps.length}
                        itemSize={74}
                    >
                        {({data, index, style}) => (
                            <button
                                className={"list__item " + (data[index].id === selectedID ? "list__item_current" : "") }
                                style={style}
                                onClick={() => { clickHandler(data[index], index) }}
                            >
                                Клиент: <b>{data[index].client.name}</b><br />
                                Тип: <b>{types[data[index].type]}</b><br />
                                Цена: <b>{data[index].price}</b>
                            </button>
                        )}
                    </List>
                </div>


                <MapContainer
                    className="map"
                    center={[43.238949, 76.889709]}
                    zoom={13}
                    whenCreated={setMap}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MarkerClusterGroup>
                        {apps.map((app, index) =>
                            <Marker
                                key={app.id}
                                position={[app.coords.lat, app.coords.long]}
                                icon={getMarkerIcon(app.id)}
                                eventHandlers={{
                                    click: () => {
                                        clickHandler(app, index);
                                    },
                                    mouseover: (e) => {
                                        e.target.openPopup();
                                    },
                                    mouseout: (e) => {
                                        e.target.closePopup();
                                    }
                                }}
                            >
                                <Popup>
                                    Клиент: <b>{app.client.name}</b><br />
                                    Тип: <b>{types[app.type]}</b><br />
                                    Цена: <b>{app.price}</b><br />
                                    Телефон: <b>{app.client.phone}</b>
                                </Popup>
                            </Marker>
                        )}
                    </MarkerClusterGroup>
                </MapContainer>
            </div>
        </div>
    );
}

export default App;
