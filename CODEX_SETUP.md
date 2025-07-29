# Codex Service Setup Guide

## Vấn đề đã được khắc phục

Lỗi ChromeDriver với status code 127 và version incompatibility đã được khắc phục bằng cách:

1. **Cài đặt Chrome và ChromeDriver tương thích trong Docker container**
2. **Thêm webdriver-manager để quản lý driver tự động**
3. **Cấu hình headless mode cho môi trường container**
4. **Thiết lập Xvfb cho virtual display**
5. **Sử dụng Chrome for Testing API để tải ChromeDriver tương thích**
6. **Tự động tạo unique user data directory và cleanup sau khi sử dụng**
7. **Start.sh script missing**: Sửa lỗi "exec /start.sh: no such file or directory" bằng cách copy script từ host

## Cách rebuild và chạy lại

### 1. Stop container hiện tại
```bash
docker compose down
```

### 2. Rebuild với các thay đổi mới
```bash
docker compose up --build -d
```

### 3. Kiểm tra logs
```bash
docker compose logs backend
```

## Chạy với Chrome UI (Recommended)

Chrome hiện tại được cấu hình để chạy với UI (non-headless mode) để tương tác tốt hơn với Codex.

### Trên Linux/macOS với X11:
```bash
# Cho phép X11 forwarding
xhost +local:docker

# Chạy với DISPLAY environment
DISPLAY=$DISPLAY docker compose up --build -d
```

### Trên Windows với WSL2:
```bash
# Cài đặt X Server (VcXsrv hoặc Xming)
# Sau đó chạy:
export DISPLAY=host.docker.internal:0.0
docker compose up --build -d
```

## Các thay đổi đã thực hiện

### 1. Dockerfile.backend
- Cài đặt Google Chrome stable
- Cài đặt ChromeDriver tự động
- Thêm Xvfb cho virtual display
- Thêm startup script

### 2. CodexService
- Thêm headless mode
- Thêm webdriver-manager
- Tối ưu Chrome options cho container
- Giữ JavaScript enabled cho web interactions

### 3. Requirements.txt
- Thêm webdriver-manager==4.0.1

### 4. Startup Script
- Khởi động Xvfb trước khi chạy ứng dụng
- Thiết lập DISPLAY environment

## API Endpoints

Sau khi rebuild, các API endpoints sau sẽ hoạt động:

- `GET /api/codex/repos` - Lấy danh sách repositories
- `POST /api/codex/run` - Submit prompt với repo_label
- `GET /api/codex/task/{task_id}` - Lấy thông tin task
- `GET /api/codex/task/submitted` - Lấy tasks đã submit theo repo

## Troubleshooting

### Nếu vẫn gặp lỗi ChromeDriver:
1. Kiểm tra logs trong container:
   ```bash
   docker logs backend
   ```

2. Vào container để debug:
   ```bash
   docker exec -it backend bash
   google-chrome --version
   chromedriver --version
   ```

3. Kiểm tra X11 forwarding (nếu chạy với Chrome UI):
   ```bash
   echo $DISPLAY
   xhost +local:docker
   ```

### Nếu gặp lỗi "user data directory is already in use":
- Service đã được cập nhật để tự động tạo unique user data directory cho mỗi session
- Mỗi session sử dụng UUID để tránh conflict
- Tự động cleanup directory sau khi hoàn thành
- Nếu vẫn gặp lỗi, restart container:
   ```bash
   docker-compose restart backend
   ```

### Nếu gặp lỗi "exec /start.sh: no such file or directory":
- Dockerfile đã được cập nhật để copy start.sh từ host thay vì tạo inline
- Đảm bảo file `dockers/start.sh` tồn tại và có quyền thực thi
- Rebuild container để áp dụng thay đổi:
   ```bash
   docker-compose build backend
   docker-compose up backend
   ```

4. Kiểm tra Xvfb:
```bash
docker exec -it <container_name> ps aux | grep Xvfb
```