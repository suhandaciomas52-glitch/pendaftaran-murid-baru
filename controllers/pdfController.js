const PDFDocument = require('pdfkit');
const pool = require('../config/db');

async function buktiPendaftaran(req, res) {
  try {
    const [applicants] = await pool.query(
      `SELECT a.*, m.name AS major_name, s.name AS school_name, s.address AS school_address
       FROM applicants a
       LEFT JOIN majors m ON m.id = a.major_id
       LEFT JOIN schools s ON s.id = a.school_id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (!applicants.length) return res.status(404).render('error', { status: 404, message: 'Pendaftaran tidak ditemukan.' });

    // Hanya pemilik pendaftaran atau admin yang boleh melihat
    const applicant = applicants[0];
    if (req.user.role === 'candidate_student' && applicant.user_id !== req.user.id) {
      return res.status(403).render('error', { status: 403, message: 'Akses ditolak.' });
    }
    if (req.user.role === 'admin_school' && applicant.school_id !== req.user.school_id) {
      return res.status(403).render('error', { status: 403, message: 'Akses ditolak.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bukti-pendaftaran-${applicant.registration_number || applicant.id}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Kop
    doc.fontSize(20).fillColor('#1a56db').text('EduEnroll', { align: 'center' });
    doc.fontSize(13).fillColor('#1f2a44').text('PPDB Yayasan Pendidikan SMK', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1a56db').lineWidth(2).stroke();
    doc.moveDown();

    doc.fontSize(18).font('Helvetica-Bold').text('BUKTI PENDAFTARAN', { align: 'center' });
    doc.font('Helvetica');
    doc.moveDown();

    // Info
    const rows = [
      ['Nomor Registrasi', applicant.registration_number || '-'],
      ['Nama Lengkap', applicant.full_name],
      ['Sekolah', applicant.school_name || '-'],
      ['Jurusan', applicant.major_name || '-'],
      ['Tempat Lahir', applicant.place_of_birth || '-'],
      ['Tanggal Lahir', applicant.date_of_birth ? String(applicant.date_of_birth) : '-'],
      ['Jenis Kelamin', applicant.gender === 'male' ? 'Laki-laki' : applicant.gender === 'female' ? 'Perempuan' : '-'],
      ['Alamat', applicant.address || '-'],
      ['No. HP', applicant.phone || '-'],
      ['Sekolah Asal', applicant.previous_school || '-'],
      ['Status', applicant.status],
      ['Waktu Pendaftaran', String(applicant.created_at || '')],
    ];

    rows.forEach(([k, v]) => {
      doc.font('Helvetica-Bold').text(`${k}:`, { align: 'left', continued: false });
      doc.font('Helvetica').text(`  ${v}`);
      doc.moveDown(0.15);
    });

    doc.moveDown(1);
    doc.font('Helvetica').fontSize(10).fillColor('#666')
      .text('Dokumen ini adalah bukti resmi pendaftaran PPDB melalui platform EduEnroll.', { align: 'center' });

    doc.end();
  } catch (err) {
    res.status(500).render('error', { status: 500, message: err.message });
  }
}

module.exports = { buktiPendaftaran };