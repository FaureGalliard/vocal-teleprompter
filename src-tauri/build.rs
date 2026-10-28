fn main() {
    #[cfg(windows)]
    vosk::provide();
    tauri_build::build()
}

/// Speech recognition runs on Vosk, a native library. Its Windows build is
/// downloaded once into `vosk/` (kept out of git), linked from there and
/// copied next to the executables so `tauri dev` and `cargo test` find it.
#[cfg(windows)]
mod vosk {
    use std::fs;
    use std::io::Read;
    use std::path::{Path, PathBuf};

    const VERSION: &str = "0.3.45";

    pub const DLLS: [&str; 4] = [
        "libvosk.dll",
        "libgcc_s_seh-1.dll",
        "libstdc++-6.dll",
        "libwinpthread-1.dll",
    ];

    pub fn provide() {
        let manifest = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
        let dir = manifest.join("vosk").join(format!("vosk-win64-{VERSION}"));
        if !dir.join("libvosk.lib").exists() {
            download(&manifest.join("vosk"));
        }
        println!("cargo:rustc-link-search=native={}", dir.display());
        println!("cargo:rerun-if-changed=build.rs");

        // OUT_DIR is target/<profile>/build/<crate>/out
        let out = PathBuf::from(std::env::var("OUT_DIR").unwrap());
        let profile_dir = out.ancestors().nth(3).unwrap().to_path_buf();
        for target in [profile_dir.clone(), profile_dir.join("deps")] {
            for dll in DLLS {
                let to = target.join(dll);
                if !to.exists() {
                    let _ = fs::create_dir_all(&target);
                    fs::copy(dir.join(dll), &to).expect("copy Vosk DLL");
                }
            }
        }
    }

    fn download(into: &Path) {
        let url = format!(
            "https://github.com/alphacep/vosk-api/releases/download/v{VERSION}/vosk-win64-{VERSION}.zip"
        );
        let mut bytes = Vec::new();
        ureq::get(&url)
            .call()
            .expect("download Vosk")
            .into_body()
            .into_reader()
            .read_to_end(&mut bytes)
            .expect("read Vosk download");
        fs::create_dir_all(into).unwrap();
        zip::ZipArchive::new(std::io::Cursor::new(bytes))
            .expect("open Vosk archive")
            .extract(into)
            .expect("extract Vosk");
    }
}
