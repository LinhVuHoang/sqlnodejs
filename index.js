const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

//Tạo sever

app.listen(PORT,function (){
    console.log("sever is running...")
    });
//config các file static
app.use(express.static("public"));

//app.get("/",function (req,res) {
    //res.send("Đây là trang chủ!");

//});
//config sử dụng ejs
app.set("view engine","ejs");
//config connect MSSQL
const mssql = require("mssql");
const config = {
    server:'cloud-apt.database.windows.net',
    database:'Development',
    user: 'quanghoa',
    password: 'Studentaptech123'
}
//const config = {
  //  user: 'quanghoa',
    //password: 'Studentaptech123',
    //server: 'cloud-apt.database.windows.net',
    //database: 'T2004E',
    //options: {
      //  encrypt: false,
       // enableArithAbort: true
    //}
//}
mssql.connect(config,function (err){
    if(err) console.log(err);
    else console.log("connect db thành công");
});
//tạo đối tượng truy vấn dữ liệu
var db = new mssql.Request();

//trang chủ
app.get("/",function(req,res){
    //lay du lieu
    db.query("SELECT * FROM Lab4_KhachHang", function(err,rows){
        if(err) res.send("No value");
        else
            res.render("home",{
                khs:rows.recordset
            })
        //res.send(rows.recordset);
    })
    //res.render("home");
});
app.get("/search",function (req,res){
    let key_search ="'%"+req.query.keyword+"%'";
    //lấy dữ liệu
    db.query("select * from Lab4_KhachHang WHERE TenKH LIKE "+key_search,function (err,rows){
        if(err) res.send("không có kết quả");
        else
            res.render("home",{
                khs:rows.recordset
            })
    })
    //res.render("home")
});
//map.function(value) vòng lặp
app.get("/danhsachsanpham",function (req,res){
    db.query("select * from Lab4_SanPham",function (err,rows){
        if (err) res.send("no values");
        else
            res.render("sp",{
                sps:rows.recordset
            })
    })
})
//link trả về form thêm khách hàng
app.get("/them-khach-hang",function (req,res){
    res.render("form");
})
//link nhận dữ liệu để thêm vào db
const bodyParser =require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
app.post("/luu-khach-hang",function (req,res){
    let ten = req.body.TenKH;
    let dt = req.body.DienThoai;
    let dc = req.body.DiaChi;
    let sql_text = "INSERT INTO Lab4_KhachHang(TenKH,DienThoai,DiaChi) VALUES(N'"+ten+"',N'"+dt+"',N'"+dc+"')"
    db.query(sql_text,function (err,rows){
        if (err) res.send(err);
       // else res.send("Thêm Khách Hàng Thành Công!");
       else res.redirect("/")
    })
})
app.get("/sanpham",function(req,res){
    //lay du lieu
    db.query("SELECT * FROM Lab4_SanPham", function(err,rows){
        if(err) res.send("No value");
        else
            res.render("sp",{
                sps:rows.recordset
            })
        //res.send(rows.recordset);
    })
    //res.render("home");
});
app.get("/them-san-pham",function (req,res){
    res.render("tsp");
})
app.post("/luu-san-pham",function (req,res){
    let name = req.body.TenSP;
    let  mtsp = req.body.MoTa;
    let dvsp = req.body.DonVi;
    let gsp = req.body.Gia;
    let sql1_text = "INSERT INTO Lab4_SanPham(TenSP,MoTa,DonVi,Gia) VALUES(N'"+name+"',N'"+mtsp+"','"+dvsp+"','"+gsp+"')"
    db.query(sql1_text,function (err,rows){
        if (err) res.send(err);
        // else res.send("Thêm Sản Phẩm Thành Công!");
            //trả về đường link /sanpham
        else res.redirect("/sanpham");
    })
})
//tạo form nhập đơn hàng
app.get("/tao-don-hang",function (req,res){
    let sql_text = "SELECT * FROM Lab4_KhachHang; SELECT * FROM Lab4_SanPham";
    db.query(sql_text,function (err,rows){
        if (err) res.send(err);
        else {
            res.render("donhang",{
                khs:rows.recordsets[0],
                sps:rows.recordsets[1],
            })
            //2 câu trở lên chọn recordsets
            //1 chọn recordset vì nó chọn cái cuối cùng
        }
    })
})
//nhận dữ liệu tạo đơn hàng
app.post("/luu-don-hang",function (req,res){
    let khID = req.body.KhachHangID;
    let spID = req.body.SanPhamID;
    let sql_text = "SELECT * FROM Lab4_SanPham WHERE ID IN ("+spID+");";
    db.query(sql_text,function (err,rows){
        if (err) res.send(err)
        else{
            let sps=rows.recordset;
            let tongtien =0;
            sps.map(function (e){
                tongtien += e.Gia;
            });
            //select scope_identity -- lấy mã số
            let sql_text2 = "INSERT INTO Lab4_DonHang(KhachHangID,TongTien,ThoiGian) VALUES("+khID+","+tongtien+",GETDATE());SELECT SCOPE_IDENTITY() AS MaSo";
            db.query(sql_text2,function (err,rows){
                let donhang = rows.recordset[0];
                let MaSo = donhang.MaSo;
                let sql_text3 ="";
                sps.map(function (e){
                    sql_text3+="INSERT INTO Lab4_DonHang_SanPham(MaSo,SanPhamID,SoLuong,ThanhTien) VALUES("+MaSo+","+e.ID+",1,"+(e.Gia*1)+");";
                })
                db.query(sql_text3,function (err,rows){
                    if (err) res.send(err);
                    else res.send("Tạo Đơn Thành Công");
                })
            })
        }
    })
    //res.send(spID);
})
// async là thông báo đồng bộ hóa , k có await sẽ k chờ có await sẽ chờ, đúng trả về result sai trả về catch(function ( err)
app.get("/chi-tiet-khach-hang/:id",async function (req,res){
    let khid = req.params.id;
    let sql_text = "SELECT * FROM Lab4_KhachHang WHERE ID ="+khid;
    let kh ="Khong co";
    await db.query(sql_text).then(result=>{
      kh = result;
}).catch(function (err){
    console.log(err);
    });
    let sql_text2 ="SELECT * FROM Lab4_DonHang WHERE KhachHangID ="+khid    ;
    let donhang=[];
    await db.query(sql_text2).then(result =>{
        donhang = result;

    }).catch(function (err){
        console.log(err);
    });
    await res.render("khachhang",{
        khachhang:kh.recordset[0],
        donhang:donhang.recordset
    });
})
//không đẩy node_modules