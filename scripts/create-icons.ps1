# Rebuild the code-drawn Pokette pocket icons. No external images or fonts.
Add-Type -AssemblyName System.Drawing
$iconDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\public\icons'))
New-Item -ItemType Directory -Force -Path $iconDirectory | Out-Null
foreach ($size in @(180,192,512)) {
  $bitmap = New-Object System.Drawing.Bitmap($size,$size)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.ScaleTransform($size / 512.0,$size / 512.0)
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#DCC9F5'))
  $plum = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#49384F'),14)
  $cream = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#FFF2D9'))
  $pink = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#F8CBDD'))
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddLine(132,186,380,186)
  $path.AddLine(380,186,380,304)
  $path.AddBezier(380,304,380,376,320,410,256,423)
  $path.AddBezier(256,423,192,410,132,376,132,304)
  $path.CloseFigure()
  $g.FillPath($cream,$path)
  $g.DrawPath($plum,$path)
  $plum.Width = 8
  $plum.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
  $g.DrawLine($plum,142,218,370,218)
  $plum.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Solid
  $heart = New-Object System.Drawing.Drawing2D.GraphicsPath
  $heart.AddBezier(256,334,238,320,198,295,198,269)
  $heart.AddBezier(198,269,198,239,238,233,256,260)
  $heart.AddBezier(256,260,274,233,314,239,314,269)
  $heart.AddBezier(314,269,314,295,274,320,256,334)
  $heart.CloseFigure()
  $g.FillPath($pink,$heart)
  $g.DrawPath($plum,$heart)
  $g.DrawLine($plum,350,92,350,142)
  $g.DrawLine($plum,325,117,375,117)
  $bitmap.Save((Join-Path $iconDirectory "pokette-$size.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  if($size -eq 512){$bitmap.Save((Join-Path $iconDirectory 'pokette-maskable-512.png'),[System.Drawing.Imaging.ImageFormat]::Png)}
  $heart.Dispose(); $path.Dispose(); $pink.Dispose(); $cream.Dispose(); $plum.Dispose(); $g.Dispose(); $bitmap.Dispose()
}
