/**
 * Serval Servo Backend Server
 * 
 * This is a WebSocket server that acts as a bridge between the Serval frontend
 * and the Servo browser engine.
 * 
 * Architecture:
 * - Receives navigation commands from frontend via WebSocket
 * - Spawns and manages Servo instances for each tab
 * - Sends page events back to frontend (title changes, load events, etc.)
 * 
 * To use with real Servo:
 * 1. Build Servo from https://github.com/servo/servo
 * 2. Update the servo_process_manager to spawn actual Servo processes
 * 3. Implement proper IPC with Servo using its embedding API
 */

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use futures::{StreamExt, SinkExt};
use serde::{Deserialize, Serialize};

/// Message types exchanged between frontend and backend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
enum ServoMessage {
    // Commands from frontend
    Initialize { #[serde(rename = "tabId")] tab_id: String },
    Navigate { #[serde(rename = "tabId")] tab_id: String, url: String },
    Back { #[serde(rename = "tabId")] tab_id: String },
    Forward { #[serde(rename = "tabId")] tab_id: String },
    Refresh { #[serde(rename = "tabId")] tab_id: String },
    Shutdown { #[serde(rename = "tabId")] tab_id: String },
    
    // Events to frontend
    Ready,
    TitleChange { #[serde(rename = "tabId")] tab_id: String, title: String },
    UrlChange { #[serde(rename = "tabId")] tab_id: String, url: String },
    LoadStart { #[serde(rename = "tabId")] tab_id: String, url: String },
    LoadComplete { #[serde(rename = "tabId")] tab_id: String, url: String },
    ProcessCrash { #[serde(rename = "tabId")] tab_id: String, #[serde(rename = "processId")] process_id: String },
}

/// Manages Servo processes for different tabs
struct ServoProcessManager {
    tabs: Arc<RwLock<HashMap<String, TabInfo>>>,
}

#[derive(Clone)]
struct TabInfo {
    url: String,
    title: String,
    history: Vec<String>,
    history_index: usize,
}

impl ServoProcessManager {
    fn new() -> Self {
        Self {
            tabs: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Initialize a tab
    async fn initialize_tab(&self, tab_id: String) {
        let mut tabs = self.tabs.write().await;
        tabs.insert(tab_id.clone(), TabInfo {
            url: String::new(),
            title: "New Tab".to_string(),
            history: Vec::new(),
            history_index: 0,
        });
        println!("[ServoBackend] Initialized tab: {}", tab_id);
    }

    /// Navigate to URL
    /// 
    /// In a real implementation, this would:
    /// 1. Get or create a Servo instance for the tab
    /// 2. Call Servo's navigation API
    /// 3. Listen for Servo events and forward them
    async fn navigate(&self, tab_id: String, url: String) -> Vec<ServoMessage> {
        let mut tabs = self.tabs.write().await;
        let mut events = Vec::new();

        if let Some(tab) = tabs.get_mut(&tab_id) {
            println!("[ServoBackend] Navigating tab {} to {}", tab_id, url);
            
            // Update history
            if tab.history_index < tab.history.len() {
                tab.history.truncate(tab.history_index + 1);
            }
            tab.history.push(url.clone());
            tab.history_index = tab.history.len() - 1;
            tab.url = url.clone();

            // Send load events
            events.push(ServoMessage::LoadStart {
                tab_id: tab_id.clone(),
                url: url.clone(),
            });

            // Simulate title extraction (in real implementation, Servo provides this)
            let title = extract_title_from_url(&url);
            tab.title = title.clone();

            events.push(ServoMessage::TitleChange {
                tab_id: tab_id.clone(),
                title,
            });

            events.push(ServoMessage::UrlChange {
                tab_id: tab_id.clone(),
                url: url.clone(),
            });

            events.push(ServoMessage::LoadComplete {
                tab_id: tab_id.clone(),
                url,
            });
        }

        events
    }

    /// Go back in history
    async fn go_back(&self, tab_id: String) -> Vec<ServoMessage> {
        let mut tabs = self.tabs.write().await;
        let mut events = Vec::new();

        if let Some(tab) = tabs.get_mut(&tab_id) {
            if tab.history_index > 0 {
                tab.history_index -= 1;
                let url = tab.history[tab.history_index].clone();
                tab.url = url.clone();

                events.push(ServoMessage::UrlChange {
                    tab_id: tab_id.clone(),
                    url: url.clone(),
                });

                events.push(ServoMessage::LoadStart {
                    tab_id: tab_id.clone(),
                    url: url.clone(),
                });

                events.push(ServoMessage::LoadComplete {
                    tab_id,
                    url,
                });
            }
        }

        events
    }

    /// Go forward in history
    async fn go_forward(&self, tab_id: String) -> Vec<ServoMessage> {
        let mut tabs = self.tabs.write().await;
        let mut events = Vec::new();

        if let Some(tab) = tabs.get_mut(&tab_id) {
            if tab.history_index < tab.history.len() - 1 {
                tab.history_index += 1;
                let url = tab.history[tab.history_index].clone();
                tab.url = url.clone();

                events.push(ServoMessage::UrlChange {
                    tab_id: tab_id.clone(),
                    url: url.clone(),
                });

                events.push(ServoMessage::LoadStart {
                    tab_id: tab_id.clone(),
                    url: url.clone(),
                });

                events.push(ServoMessage::LoadComplete {
                    tab_id,
                    url,
                });
            }
        }

        events
    }

    /// Refresh current page
    async fn refresh(&self, tab_id: String) -> Vec<ServoMessage> {
        let tabs = self.tabs.read().await;
        let mut events = Vec::new();

        if let Some(tab) = tabs.get(&tab_id) {
            let url = tab.url.clone();
            drop(tabs); // Release read lock before calling navigate
            events = self.navigate(tab_id, url).await;
        }

        events
    }

    /// Shutdown a tab
    async fn shutdown_tab(&self, tab_id: String) {
        let mut tabs = self.tabs.write().await;
        tabs.remove(&tab_id);
        println!("[ServoBackend] Shutdown tab: {}", tab_id);
    }
}

/// Extract title from URL (placeholder for real implementation)
fn extract_title_from_url(url: &str) -> String {
    url::Url::parse(url)
        .ok()
        .and_then(|u| u.host_str().map(|h| h.to_string()))
        .unwrap_or_else(|| "New Tab".to_string())
}

/// Handle a single WebSocket connection
async fn handle_connection(stream: TcpStream, manager: Arc<ServoProcessManager>) {
    println!("[ServoBackend] New WebSocket connection");

    let ws_stream = match accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => {
            eprintln!("[ServoBackend] Error accepting connection: {}", e);
            return;
        }
    };

    let (mut write, mut read) = ws_stream.split();

    // Send ready message
    let ready_msg = serde_json::to_string(&ServoMessage::Ready).unwrap();
    if let Err(e) = write.send(Message::Text(ready_msg)).await {
        eprintln!("[ServoBackend] Error sending ready message: {}", e);
        return;
    }

    // Process messages
    while let Some(msg) = read.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                match serde_json::from_str::<ServoMessage>(&text) {
                    Ok(message) => {
                        let events = match message {
                            ServoMessage::Initialize { tab_id } => {
                                manager.initialize_tab(tab_id).await;
                                vec![]
                            }
                            ServoMessage::Navigate { tab_id, url } => {
                                manager.navigate(tab_id, url).await
                            }
                            ServoMessage::Back { tab_id } => {
                                manager.go_back(tab_id).await
                            }
                            ServoMessage::Forward { tab_id } => {
                                manager.go_forward(tab_id).await
                            }
                            ServoMessage::Refresh { tab_id } => {
                                manager.refresh(tab_id).await
                            }
                            ServoMessage::Shutdown { tab_id } => {
                                manager.shutdown_tab(tab_id).await;
                                vec![]
                            }
                            _ => vec![],
                        };

                        // Send events back to frontend
                        for event in events {
                            let event_json = serde_json::to_string(&event).unwrap();
                            if let Err(e) = write.send(Message::Text(event_json)).await {
                                eprintln!("[ServoBackend] Error sending event: {}", e);
                                break;
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("[ServoBackend] Error parsing message: {}", e);
                    }
                }
            }
            Ok(Message::Close(_)) => {
                println!("[ServoBackend] Connection closed");
                break;
            }
            Err(e) => {
                eprintln!("[ServoBackend] WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }
}

#[tokio::main]
async fn main() {
    let addr = "127.0.0.1:8080";
    let listener = TcpListener::bind(&addr).await.expect("Failed to bind");
    println!("[ServoBackend] WebSocket server listening on ws://{}", addr);
    println!("[ServoBackend] Waiting for connections from Serval frontend...");

    let manager = Arc::new(ServoProcessManager::new());

    while let Ok((stream, _)) = listener.accept().await {
        let manager = Arc::clone(&manager);
        tokio::spawn(async move {
            handle_connection(stream, manager).await;
        });
    }
}
