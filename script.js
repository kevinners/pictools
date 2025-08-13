document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadedImages = document.getElementById('uploadedImages');
    const gridContainer = document.getElementById('gridContainer');
    const rowsInput = document.getElementById('rowsInput');
    const colsInput = document.getElementById('colsInput');
    const applyCustomLayout = document.getElementById('applyCustomLayout');
    const gridSpacing = document.getElementById('gridSpacing');
    const spacingValue = document.getElementById('spacingValue');
    const exportFormat = document.getElementById('exportFormat');
    const exportQuality = document.getElementById('exportQuality');
    const qualityValue = document.getElementById('qualityValue');
    const exportWidth = document.getElementById('exportWidth');
    const exportHeight = document.getElementById('exportHeight');
    const exportButton = document.getElementById('exportButton');
    const layoutButtons = document.querySelectorAll('.layout-buttons button');
    
    // 使用教程弹框元素
    const tutorialModal = document.getElementById('tutorial-modal');
    const tutorialNavLink = document.getElementById('tutorial-nav');
    const tutorialFooterLink = document.getElementById('tutorial-footer');
    const closeButton = document.querySelector('.close-button');

    // 状态变量
    let uploadedImagesList = [];
    let currentRows = 1;
    let currentCols = 2;
    let currentSpacing = 0; // 默认网格间距为0px
    const MAX_IMAGES = 20;
    let draggedImage = null;
    let draggedImageIndex = -1;
    let activeCell = null;
    let resizeHandleType = null;
    let initialImagePosition = { x: 0, y: 0 };
    let initialImageSize = { width: 0, height: 0 };
    let initialMousePosition = { x: 0, y: 0 };

    // 初始化网格
    createGrid(currentRows, currentCols, currentSpacing);
    
    // 更新导出设置中的宽高为网格容器的实际尺寸
    function updateExportDimensions() {
        const gridRect = gridContainer.getBoundingClientRect();
        exportWidth.value = Math.round(gridRect.width);
        exportHeight.value = Math.round(gridRect.height);
    }
    
    // 页面加载后更新导出尺寸
    setTimeout(updateExportDimensions, 100);

    // 上传区域点击事件
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 使用教程弹框功能
    function openTutorialModal() {
        tutorialModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }
    
    function closeTutorialModal() {
        tutorialModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // 恢复背景滚动
    }
    
    // 点击导航栏中的使用教程链接
    tutorialNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        openTutorialModal();
    });
    
    // 点击页脚中的使用教程链接
    tutorialFooterLink.addEventListener('click', (e) => {
        e.preventDefault();
        openTutorialModal();
    });
    
    // 点击关闭按钮
    closeButton.addEventListener('click', closeTutorialModal);
    
    // 点击弹框外部区域关闭弹框
    window.addEventListener('click', (e) => {
        if (e.target === tutorialModal) {
            closeTutorialModal();
        }
    });
    
    // ESC键关闭弹框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tutorialModal.style.display === 'block') {
            closeTutorialModal();
        }
    });

    // 文件选择事件
    fileInput.addEventListener('change', handleFileSelect);

    // 拖拽上传事件
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    // 预设布局按钮事件
    layoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            const rows = parseInt(button.dataset.rows);
            const cols = parseInt(button.dataset.cols);
            
            // 更新输入框的值
            rowsInput.value = rows;
            colsInput.value = cols;
            
            // 应用新布局
            applyLayout(rows, cols);
            
            // 更新活动按钮样式
            layoutButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // 自定义布局应用按钮事件
    applyCustomLayout.addEventListener('click', () => {
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);
        
        if (rows > 0 && cols > 0 && rows <= 10 && cols <= 10) {
            applyLayout(rows, cols);
            
            // 移除所有预设按钮的活动状态
            layoutButtons.forEach(btn => btn.classList.remove('active'));
        }
    });

    // 网格间距滑块事件
    gridSpacing.addEventListener('input', () => {
        currentSpacing = parseInt(gridSpacing.value);
        spacingValue.textContent = `${currentSpacing}px`;
        updateGridSpacing(currentSpacing);
    });

    // 导出质量滑块事件
    exportQuality.addEventListener('input', () => {
        const quality = parseFloat(exportQuality.value);
        qualityValue.textContent = `${Math.round(quality * 100)}%`;
    });

    // 导出按钮事件
    exportButton.addEventListener('click', exportImage);

    // 处理文件选择
    function handleFileSelect(e) {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    }

    // 处理文件
    function handleFiles(files) {
        const remainingSlots = MAX_IMAGES - uploadedImagesList.length;
        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        
        if (filesToProcess.length === 0) {
            alert(`已达到最大上传数量 ${MAX_IMAGES} 张图片`);
            return;
        }
        
        filesToProcess.forEach(file => {
            if (!file.type.match('image.*')) {
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imageData = {
                    src: e.target.result,
                    file: file
                };
                
                uploadedImagesList.push(imageData);
                renderImagePreview(imageData, uploadedImagesList.length - 1);
                
                if (uploadedImagesList.length >= MAX_IMAGES) {
                    uploadArea.style.display = 'none';
                }
            };
            
            reader.readAsDataURL(file);
        });
    }

    // 渲染图片预览
    function renderImagePreview(imageData, index) {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview';
        previewContainer.dataset.index = index;
        
        const img = document.createElement('img');
        img.src = imageData.src;
        img.alt = `上传图片 ${index + 1}`;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-image';
        removeButton.innerHTML = '×';
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            removeImage(index);
        });
        
        previewContainer.appendChild(img);
        previewContainer.appendChild(removeButton);
        
        // 添加拖拽功能
        previewContainer.draggable = true;
        previewContainer.addEventListener('dragstart', (e) => {
            draggedImage = imageData;
            draggedImageIndex = index;
            e.dataTransfer.setData('text/plain', index);
        });
        
        // 点击预览图片将其添加到当前选中的网格单元
        previewContainer.addEventListener('click', () => {
            if (activeCell) {
                addImageToCell(activeCell, imageData);
            }
        });
        
        uploadedImages.appendChild(previewContainer);
    }

    // 移除图片
    function removeImage(index) {
        uploadedImagesList.splice(index, 1);
        
        // 重新渲染所有预览图片
        uploadedImages.innerHTML = '';
        uploadedImagesList.forEach((imageData, idx) => {
            renderImagePreview(imageData, idx);
        });
        
        // 如果之前已达到最大上传数量，现在移除了一张，则显示上传区域
        if (uploadedImagesList.length < MAX_IMAGES) {
            uploadArea.style.display = 'block';
        }
        
        // 更新网格中的图片索引
        updateGridImageIndices();
    }

    // 更新网格中的图片索引
    function updateGridImageIndices() {
        const gridImages = document.querySelectorAll('.grid-image-container');
        
        gridImages.forEach(container => {
            const imageIndex = parseInt(container.dataset.imageIndex);
            
            if (imageIndex !== undefined) {
                // 如果图片已被删除，则移除该图片容器
                if (imageIndex >= uploadedImagesList.length) {
                    container.remove();
                }
            }
        });
    }

    // 创建网格
    function createGrid(rows, cols, spacing) {
        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridContainer.style.gap = `${spacing}px`;
        
        for (let i = 0; i < rows * cols; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.index = i;
            
            // 添加拖拽放置事件
            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                cell.classList.add('highlight');
            });
            
            cell.addEventListener('dragleave', () => {
                cell.classList.remove('highlight');
            });
            
            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                cell.classList.remove('highlight');
                
                if (draggedImage) {
                    addImageToCell(cell, draggedImage);
                    draggedImage = null;
                }
            });
            
            // 点击单元格设置为活动单元格
            cell.addEventListener('click', () => {
                // 移除之前的活动单元格高亮
                if (activeCell) {
                    activeCell.classList.remove('highlight');
                }
                
                activeCell = cell;
                activeCell.classList.add('highlight');
            });
            
            gridContainer.appendChild(cell);
        }
    }

    // 应用布局
    function applyLayout(rows, cols) {
        currentRows = rows;
        currentCols = cols;
        createGrid(rows, cols, currentSpacing);
        // 更新导出尺寸
        setTimeout(updateExportDimensions, 100);
    }

    // 更新网格间距
    function updateGridSpacing(spacing) {
        gridContainer.style.gap = `${spacing}px`;
        // 更新导出尺寸
        setTimeout(updateExportDimensions, 100);
    }

    // 将图片添加到网格单元格
    function addImageToCell(cell, imageData) {
        // 检查单元格是否已有图片
        const existingContainer = cell.querySelector('.grid-image-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'grid-image-container';
        imageContainer.dataset.imageIndex = uploadedImagesList.indexOf(imageData);
        
        const img = document.createElement('img');
        img.className = 'grid-image';
        img.src = imageData.src;
        img.alt = `网格图片`;
        img.draggable = false; // 防止图片被拖出
        
        // 设置初始位置和大小
        imageContainer.style.transform = 'translate(0, 0)';
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.transform = 'scale(1)'; // 初始缩放比例
        
        // 添加图片控制按钮
        const controls = document.createElement('div');
        controls.className = 'image-controls';
        
        const bringToFrontBtn = document.createElement('button');
        bringToFrontBtn.innerHTML = '↑';
        bringToFrontBtn.title = '置顶';
        bringToFrontBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            imageContainer.style.zIndex = '10';
        });
        
        const sendToBackBtn = document.createElement('button');
        sendToBackBtn.innerHTML = '↓';
        sendToBackBtn.title = '置底';
        sendToBackBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            imageContainer.style.zIndex = '1';
        });
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '×';
        removeBtn.title = '移除';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            imageContainer.remove();
        });
        
        controls.appendChild(bringToFrontBtn);
        controls.appendChild(sendToBackBtn);
        controls.appendChild(removeBtn);
        
        // 添加调整大小的手柄
        const resizeHandles = [
            { class: 'top-left', cursor: 'nw-resize' },
            { class: 'top-right', cursor: 'ne-resize' },
            { class: 'bottom-left', cursor: 'sw-resize' },
            { class: 'bottom-right', cursor: 'se-resize' }
        ];
        
        resizeHandles.forEach(handle => {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = `resize-handle ${handle.class}`;
            
            resizeHandle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                resizeHandleType = handle.class;
                
                initialImageSize = {
                    width: img.offsetWidth,
                    height: img.offsetHeight
                };
                
                initialMousePosition = {
                    x: e.clientX,
                    y: e.clientY
                };
                
                document.addEventListener('mousemove', handleResize);
                document.addEventListener('mouseup', stopResize);
            });
            
            imageContainer.appendChild(resizeHandle);
        });
        
        // 图片拖动功能 - 优化以允许拖动显示超出容器的隐藏部分
        img.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            
            // 获取当前图片位置
            const transform = imageContainer.style.transform;
            const translateMatch = transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
            
            initialImagePosition = {
                x: translateMatch ? parseFloat(translateMatch[1]) : 0,
                y: translateMatch ? parseFloat(translateMatch[2]) : 0
            };
            
            initialMousePosition = {
                x: e.clientX,
                y: e.clientY
            };
            
            // 添加拖动时的样式
            img.style.cursor = 'grabbing';
            
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);
        });
        
        // 图片缩放功能（鼠标滚轮）- 优化以实现更流畅的缩放
        img.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const delta = e.deltaY > 0 ? 0.9 : 1.1; // 缩小或放大
            
            // 获取当前缩放比例
            const currentScale = img.style.transform ? 
                parseFloat(img.style.transform.replace('scale(', '').replace(')', '')) || 1 : 1;
            
            // 计算新的缩放比例，限制最小和最大缩放比例
            const newScale = Math.max(0.1, Math.min(5, currentScale * delta));
            
            // 应用新的缩放比例，保持图片比例
            img.style.transform = `scale(${newScale})`;
            
            // 添加过渡效果使缩放更平滑
            img.style.transition = 'transform 0.1s ease';
            setTimeout(() => {
                img.style.transition = '';
            }, 100);
        });
        
        imageContainer.appendChild(img);
        imageContainer.appendChild(controls);
        cell.appendChild(imageContainer);
        
        // 处理图片拖动
        function handleDrag(e) {
            const dx = e.clientX - initialMousePosition.x;
            const dy = e.clientY - initialMousePosition.y;
            
            const newX = initialImagePosition.x + dx;
            const newY = initialImagePosition.y + dy;
            
            imageContainer.style.transform = `translate(${newX}px, ${newY}px)`;
        }
        
        // 停止拖动
        function stopDrag() {
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);
            // 恢复鼠标样式
            img.style.cursor = 'move';
        }
        
        // 处理图片调整大小
        function handleResize(e) {
            const dx = e.clientX - initialMousePosition.x;
            const dy = e.clientY - initialMousePosition.y;
            
            // 获取图片原始尺寸比例
            const imgNaturalRatio = img.naturalWidth / img.naturalHeight;
            
            let newWidth = initialImageSize.width;
            let newHeight = initialImageSize.height;
            
            // 根据不同的调整手柄类型计算新的宽度和高度
            if (resizeHandleType.includes('right')) {
                newWidth = initialImageSize.width + dx;
                // 按比例调整高度
                newHeight = newWidth / imgNaturalRatio;
            } else if (resizeHandleType.includes('left')) {
                newWidth = initialImageSize.width - dx;
                // 按比例调整高度
                newHeight = newWidth / imgNaturalRatio;
            }
            
            if (resizeHandleType.includes('bottom')) {
                newHeight = initialImageSize.height + dy;
                // 按比例调整宽度
                newWidth = newHeight * imgNaturalRatio;
            } else if (resizeHandleType.includes('top')) {
                newHeight = initialImageSize.height - dy;
                // 按比例调整宽度
                newWidth = newHeight * imgNaturalRatio;
            }
            
            // 设置最小尺寸
            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(50, newHeight);
            
            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;
        }
        
        // 停止调整大小
        function stopResize() {
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
            resizeHandleType = null;
        }
    }

    // 导出图片
    function exportImage() {
        // 确保导出尺寸与当前网格尺寸一致
        updateExportDimensions();
        
        // 获取用户设置的宽高
        const width = parseInt(exportWidth.value);
        const height = parseInt(exportHeight.value);
        const format = exportFormat.value;
        const quality = parseFloat(exportQuality.value);
        
        // 创建一个临时的canvas元素
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // 设置背景色为网格容器的背景色
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(0, 0, width, height);
        
        // 获取网格容器的实际尺寸
        const gridRect = gridContainer.getBoundingClientRect();
        const scaleX = width / gridRect.width;
        const scaleY = height / gridRect.height;
        
        // 遍历所有网格单元格
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            const cellRect = cell.getBoundingClientRect();
            
            // 计算单元格在canvas中的位置和大小
            const cellRelativeX = cellRect.left - gridRect.left;
            const cellRelativeY = cellRect.top - gridRect.top;
            const canvasCellX = cellRelativeX * scaleX;
            const canvasCellY = cellRelativeY * scaleY;
            const canvasCellWidth = cellRect.width * scaleX;
            const canvasCellHeight = cellRect.height * scaleY;
            
            // 绘制单元格背景
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(canvasCellX, canvasCellY, canvasCellWidth, canvasCellHeight);
            
            // 绘制单元格边框
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1;
            ctx.strokeRect(canvasCellX, canvasCellY, canvasCellWidth, canvasCellHeight);
            
            const imageContainer = cell.querySelector('.grid-image-container');
            if (imageContainer) {
                const img = imageContainer.querySelector('img');
                const imageIndex = parseInt(imageContainer.dataset.imageIndex);
                
                if (img && imageIndex !== undefined && imageIndex < uploadedImagesList.length) {
                    const imgRect = img.getBoundingClientRect();
                    
                    // 计算图片相对于网格容器的位置
                    const imgRelativeX = imgRect.left - gridRect.left;
                    const imgRelativeY = imgRect.top - gridRect.top;
                    
                    // 计算图片在canvas中的位置和大小
                    const canvasX = imgRelativeX * scaleX;
                    const canvasY = imgRelativeY * scaleY;
                    const canvasWidth = imgRect.width * scaleX;
                    const canvasHeight = imgRect.height * scaleY;
                    
                    // 保存当前绘图状态
                    ctx.save();
                    
                    // 设置裁剪区域为单元格范围
                    ctx.beginPath();
                    ctx.rect(canvasCellX, canvasCellY, canvasCellWidth, canvasCellHeight);
                    ctx.clip();
                    
                    // 绘制图片到canvas
                    ctx.drawImage(img, canvasX, canvasY, canvasWidth, canvasHeight);
                    
                    // 恢复绘图状态
                    ctx.restore();
                }
            }
        });
        
        // 导出canvas为图片
        const dataURL = format === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality);
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `拼接图片.${format}`;
        link.click();
    }
});