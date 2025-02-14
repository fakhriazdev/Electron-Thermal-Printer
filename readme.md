**Interaction From Client

Using Port 8080

## Payload DEVICE_INFO (Required)

```
    {
    command: "DEVICE_INFO",
    data:{
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height
        }
    }
```

## Payload PRINT

```
    {
    command: "PRINT",
        data:   [
                { text: "Nama Toko: ABC Mart", align: "center", bold: true },
                { text: "Total: Rp 50.000", align: "right" }
                ]
    }
```

## Payload OPEN CASHDRAWER

```
    {
    command: "OPEN_CD",
    }
```


