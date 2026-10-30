//! Linux desktops take an app's icon and name from the .desktop file named
//! like it, not from the window. The .deb and .rpm install one; an AppImage
//! or a development build has none, so the dock showed a blank icon. Then
//! the app writes its own into the user's folders: a menu entry that starts
//! the AppImage, or a hidden one (only for the icon) for any other build.

use std::fs;
use std::path::PathBuf;

const NAME: &str = "vocal-teleprompter";
const ICON: &[u8] = include_bytes!("../icons/128x128.png");

pub fn ensure() {
    if let Err(e) = write() {
        eprintln!("Could not add the desktop entry: {e}");
    }
}

fn write() -> std::io::Result<()> {
    let installed = ["/usr/share/applications", "/usr/local/share/applications"]
        .iter()
        .any(|dir| PathBuf::from(dir).join(format!("{NAME}.desktop")).exists());
    if installed {
        return Ok(());
    }
    let Some(data) = dirs::data_dir() else {
        return Ok(());
    };

    let icon = data.join(format!("icons/hicolor/128x128/apps/{NAME}.png"));
    if fs::read(&icon).ok().as_deref() != Some(ICON) {
        fs::create_dir_all(icon.parent().unwrap())?;
        fs::write(&icon, ICON)?;
    }

    // An AppImage is the file named by $APPIMAGE, not its temporary mount
    let appimage = std::env::var_os("APPIMAGE").map(PathBuf::from);
    let exec = match &appimage {
        Some(path) => path.clone(),
        None => std::env::current_exe()?,
    };
    let entry = format!(
        "[Desktop Entry]\n\
         Type=Application\n\
         Name=Vocal Teleprompter\n\
         Comment=Voice-synced teleprompter that scrolls your script as you speak\n\
         Exec=\"{}\"\n\
         Icon={NAME}\n\
         StartupWMClass={NAME}\n\
         Categories=Utility;\n\
         Terminal=false\n\
         NoDisplay={}\n",
        exec.display(),
        appimage.is_none(),
    );
    let file = data.join(format!("applications/{NAME}.desktop"));
    if fs::read_to_string(&file).ok().as_deref() != Some(entry.as_str()) {
        fs::create_dir_all(file.parent().unwrap())?;
        fs::write(&file, entry)?;
    }
    Ok(())
}
