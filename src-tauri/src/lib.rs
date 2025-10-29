use serde::Serialize;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};
use tokio::{
    sync::oneshot,
    task::JoinHandle,
    time::{self, Instant},
};

// 定时器状态
#[derive(Default)]
struct TimerState {
    handle: Option<JoinHandle<()>>,
    cancel_tx: Option<oneshot::Sender<()>>,
    end_instant: Option<Instant>,
    paused_remaining: Option<Duration>,
    running: bool,
    paused: bool,
}

// Tick 事件载荷
#[derive(Serialize, Clone)]
struct TickPayload {
    remaining_ms: u64,
}

// 开始计时器
#[tauri::command]
async fn start_timer(
    app: AppHandle,
    state: State<'_, Arc<Mutex<TimerState>>>,
    total_ms: u64,
) -> Result<(), String> {
    let mut s = state.lock().map_err(|e| e.to_string())?;

    // 如果已有任务，先停止
    if let Some(tx) = s.cancel_tx.take() {
        let _ = tx.send(());
    }
    if let Some(h) = s.handle.take() {
        h.abort();
    }

    if total_ms == 0 {
        return Ok(());
    }

    s.running = true;
    s.paused = false;
    s.paused_remaining = None;

    let end = Instant::now() + Duration::from_millis(total_ms);
    s.end_instant = Some(end);

    let (tx, mut rx) = oneshot::channel::<()>();
    s.cancel_tx = Some(tx);

    let app_clone = app.clone();
    let handle = tokio::spawn(async move {
        let mut ticker = time::interval(Duration::from_millis(100)); // 每 100ms 更新一次
        ticker.set_missed_tick_behavior(time::MissedTickBehavior::Skip);

        loop {
            tokio::select! {
                _ = ticker.tick() => {
                    let now = Instant::now();
                    if now >= end {
                        let _ = app_clone.emit("timer://tick", TickPayload { remaining_ms: 0 });
                        let _ = app_clone.emit("timer://done", ());
                        break;
                    } else {
                        let remaining = end.saturating_duration_since(now);
                        let remaining_ms = remaining.as_millis() as u64;
                        let _ = app_clone.emit("timer://tick", TickPayload { remaining_ms });
                    }
                }
                _ = &mut rx => {
                    // 收到取消信号
                    let now = Instant::now();
                    if now < end {
                        let remaining = end.saturating_duration_since(now);
                        // 发送当前剩余时间
                        let remaining_ms = remaining.as_millis() as u64;
                        let _ = app_clone.emit("timer://tick", TickPayload { remaining_ms });
                    }
                    break;
                }
            }
        }
    });

    s.handle = Some(handle);

    Ok(())
}

// 暂停计时器
#[tauri::command]
async fn pause_timer(state: State<'_, Arc<Mutex<TimerState>>>) -> Result<(), String> {
    let mut s = state.lock().map_err(|e| e.to_string())?;

    if !s.running || s.paused {
        return Ok(());
    }

    // 保存剩余时间
    if let Some(end) = s.end_instant {
        let now = Instant::now();
        if now < end {
            s.paused_remaining = Some(end.saturating_duration_since(now));
        } else {
            s.paused_remaining = Some(Duration::from_secs(0));
        }
    }

    // 取消当前任务
    if let Some(tx) = s.cancel_tx.take() {
        let _ = tx.send(());
    }
    if let Some(h) = s.handle.take() {
        h.abort();
    }

    s.running = false;
    s.paused = true;

    Ok(())
}

// 恢复计时器
#[tauri::command]
async fn resume_timer(
    app: AppHandle,
    state: State<'_, Arc<Mutex<TimerState>>>,
) -> Result<(), String> {
    let mut s = state.lock().map_err(|e| e.to_string())?;

    if !s.paused {
        return Ok(());
    }

    let remain = s.paused_remaining.take().unwrap_or(Duration::from_secs(0));
    if remain.is_zero() {
        s.running = false;
        s.paused = false;
        return Ok(());
    }

    s.running = true;
    s.paused = false;

    let end = Instant::now() + remain;
    s.end_instant = Some(end);

    let (tx, mut rx) = oneshot::channel::<()>();
    s.cancel_tx = Some(tx);

    let app_clone = app.clone();
    let handle = tokio::spawn(async move {
        let mut ticker = time::interval(Duration::from_millis(100));
        ticker.set_missed_tick_behavior(time::MissedTickBehavior::Skip);

        loop {
            tokio::select! {
                _ = ticker.tick() => {
                    let now = Instant::now();
                    if now >= end {
                        let _ = app_clone.emit("timer://tick", TickPayload { remaining_ms: 0 });
                        let _ = app_clone.emit("timer://done", ());
                        break;
                    } else {
                        let remaining = end.saturating_duration_since(now);
                        let remaining_ms = remaining.as_millis() as u64;
                        let _ = app_clone.emit("timer://tick", TickPayload { remaining_ms });
                    }
                }
                _ = &mut rx => {
                    let now = Instant::now();
                    if now < end {
                        let remaining = end.saturating_duration_since(now);
                        let remaining_ms = remaining.as_millis() as u64;
                        let _ = app_clone.emit("timer://tick", TickPayload { remaining_ms });
                    }
                    break;
                }
            }
        }
    });

    s.handle = Some(handle);

    Ok(())
}

// 停止计时器
#[tauri::command]
async fn stop_timer(state: State<'_, Arc<Mutex<TimerState>>>) -> Result<(), String> {
    let mut s = state.lock().map_err(|e| e.to_string())?;

    // 取消当前任务
    if let Some(tx) = s.cancel_tx.take() {
        let _ = tx.send(());
    }
    if let Some(h) = s.handle.take() {
        h.abort();
    }

    s.running = false;
    s.paused = false;
    s.end_instant = None;
    s.paused_remaining = None;

    Ok(())
}

// 获取当前剩余时间
#[tauri::command]
async fn get_timer_remaining(
    state: State<'_, Arc<Mutex<TimerState>>>,
) -> Result<Option<u64>, String> {
    let s = state.lock().map_err(|e| e.to_string())?;

    if s.running && !s.paused {
        // 如果正在运行，计算剩余时间
        if let Some(end) = s.end_instant {
            let now = Instant::now();
            if now >= end {
                return Ok(Some(0));
            } else {
                let remaining = end.saturating_duration_since(now);
                return Ok(Some(remaining.as_millis() as u64));
            }
        }
    } else if s.paused {
        // 如果暂停，返回暂停时的剩余时间
        if let Some(remaining) = s.paused_remaining {
            return Ok(Some(remaining.as_millis() as u64));
        }
    }

    Ok(None)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .manage(Arc::new(Mutex::new(TimerState::default())))
        .invoke_handler(tauri::generate_handler![
            start_timer,
            pause_timer,
            resume_timer,
            stop_timer,
            get_timer_remaining
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
