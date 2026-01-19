export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#111317",color:"#f8f9fa",padding:"24px",textAlign:"center"}}>
      <div>
        <h1 style={{fontSize:"20px",marginBottom:"8px"}}>You’re offline</h1>
        <p style={{color:"#adb5bd",maxWidth:"420px"}}>
          Dhuwa can still open offline once it’s been cached. Please connect once to finish setup.
        </p>
      </div>
    </main>
  );
}
