fn main() {
    #[cfg(windows)]
    vosk::provide();
    tauri_build::build()
}

/// Speech recognition runs on Vosk, a native library. Its Windows build is
/// downloaded once into `vosk/` (kept out of git), linked from there and
/// copied next to the executables so `tauri dev` and `cargo test` find it.
/// The English model is fetched there too, to ship inside the installer.
#[cfg(windows)]
mod vosk {
    use std::fs;
    use std::io::Read;
    use std::path::{Path, PathBuf};

    const VERSION: &str = "0.3.45";

    /// Bundled so the app understands English out of the box
    const BUNDLED_MODEL: &str = "vosk-model-small-en-us-0.15";

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
            download(
                &format!(
                    "https://github.com/alphacep/vosk-api/releases/download/v{VERSION}/vosk-win64-{VERSION}.zip"
                ),
                &manifest.join("vosk"),
            );
        }
        let models = manifest.join("vosk").join("models");
        if !models.join(BUNDLED_MODEL).join("am").exists() {
            download(
                &format!("https://alphacephei.com/vosk/models/{BUNDLED_MODEL}.zip"),
                &models,
            );
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

    fn download(url: &str, into: &Path) {
        let mut bytes = Vec::new();
        ureq::get(url)
            .call()
            .unwrap_or_else(|e| panic!("download {url}: {e}"))
            .into_body()
            .into_reader()
            .read_to_end(&mut bytes)
            .unwrap_or_else(|e| panic!("read {url}: {e}"));
        fs::create_dir_all(into).unwrap();
        zip::ZipArchive::new(std::io::Cursor::new(bytes))
            .unwrap_or_else(|e| panic!("open {url}: {e}"))
            .extract(into)
            .unwrap_or_else(|e| panic!("extract {url}: {e}"));
    }
}
