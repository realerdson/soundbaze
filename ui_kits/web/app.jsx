// SoundBaze — Web UI Kit shell
const { useState, useEffect } = React;

function App() {
  const [route, setRoute] = useState({ name: "home" });
  const navigate = (r) => { window.scrollTo({ top: 0, behavior: "instant" }); setRoute(r); };

  let screen = null;
  if (route.name === "home") {
    screen = (
      <>
        <Hero navigate={navigate} />
        <TrendingGrid navigate={navigate} />
        <FeatureRow />
        <CommunityList />
      </>
    );
  } else if (route.name === "song") {
    const song = window.SOUNDBAZE_DATA.songs.find((s) => s.id === route.id) || window.SOUNDBAZE_DATA.songs[0];
    screen = <SongPage song={song} navigate={navigate} />;
  } else if (route.name === "artist") {
    const artist = window.SOUNDBAZE_DATA.artists[route.id] || window.SOUNDBAZE_DATA.artists.saba;
    screen = <ArtistPage artist={artist} navigate={navigate} />;
  } else if (route.name === "search") {
    screen = <SearchResults q={route.q || "saba"} navigate={navigate} />;
  }

  return (
    <div className="shell" data-screen-label={`SoundBaze · ${route.name}`}>
      <TopNav route={route} navigate={navigate} />
      <main style={{ flex: 1 }}>{screen}</main>
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
