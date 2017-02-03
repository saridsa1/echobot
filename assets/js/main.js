var questionnaires = null;
var studies = null;
var patients = null;
var curr_study = "";
var db = null;

$(document).ready(function(){

	demo.initChartist();
	
	initSite();
	
	$(document).on('click','.ci-link',updatePage);
	
	$(document).on('click','.add-questionnaire',function(e){
		e.preventDefault();
		var $modal = $('#myModal');
		var qId = $modal.find('.ques-select>select').val();
		var times = $modal.find('.ques-times').val();	
		var freq = $modal.find('.ques-freq').val();
		
		db.ref('Studies/' + curr_study +'/questionnaires/'+qId).set({
		    frequency: freq,
		    times: times
		  });
		studies[curr_study].questionnaires[qId]={
		    frequency: freq,
		    times: times
		 };
		$modal.modal('hide');
		loadStudy(curr_study);
	});
	
        	
});
function updatePage(e){
	e.preventDefault();
	var $this = $(this);
	var cId = $this.attr('data-id');
	$('.sidebar .nav>li').removeClass('active');
	$this.parents('li:first').addClass('active');
	$('.ci').hide();
	$('.ci-'+cId).show();
	$('.navbar-brand').text($this.find('p').text());
}

function initSite(){
	 db = firebase.database();
	 db.ref('/Questionnaires').once('value').then(function(snapshot) {
  		questionnaires = snapshot.val();
  		var values = Object.values(questionnaires);
  		var keys = Object.keys(questionnaires);
  		var $sl = $('.ques-select select');
  		$sl.append('<option value="0">Select a Questionnaire</option>');
  		$.each(values,function(i,v){
  			$sl.append('<option value="'+keys[i]+'">'+v.name+'</option>');
  			
  			db.ref('/Patients').once('value').then(function(snapshot) {
		  		patients = snapshot.val();
		  		
		  		
		  		db.ref('/Studies').once('value').then(function(snapshot) {
			  		studies = snapshot.val();
			  		var keys = Object.keys(studies);
			  		var $ul = $('.navbar-left>.dropdown>ul');
			  		$ul.html("");
			  		$.each(keys,function(i,v){
			  			$ul.append('<li data-id="'+v+'"><a href="#">'+v+'</a></li>');
			  		});
			  		loadStudy(keys[0]);
  		
	 			});
		  		
		  		
			 });
  		});
	 });
	 
	 
  		
  		
}

function loadStudy(id){
	curr_study = id;
	var study = studies[id];
	$('.navbar-left>li.dropdown>button').html(id+' <span class="caret hidden-sm hidden-xs"></span>');
	
	$('.db-phase>.i-val').text(study.phase);
	$('.db-sites>.i-val').text(study.sites);
	$('.db-target>.i-val').text(study.targetPatientsEnollment);
	$('.db-patients>.i-val').text(Object.keys(study.patients).length);
	
	
	$('.ques-select select>option').prop('disabled',false);
	var $ul = $('.ci-questionnaires>.card table>tbody');
	$ul.html("");
	var values = Object.values(study.questionnaires);
	$.each(Object.keys(study.questionnaires),function(i,v){
		$ul.append('<tr><td>'+questionnaires[v].name+'</td><td>scheduled '+values[i].times+' times '+values[i].frequency+'</td><td class="td-actions text-right"><button type="button" rel="tooltip" title="Remove" class="btn btn-danger btn-simple btn-xs"><i class="fa fa-times"></i></button></td></tr>');
		$('.ques-select select>option[value='+v+']').prop('disabled',true);
	});
	
	$ul = $('.ci-patients>.card table>tbody');
	$ul.html("");
	$.each(Object.keys(study.patients),function(i,v){
		$ul.append('<tr><td>'+v+'</td><td>'+patients[v].email+'</td><td class="td-actions text-right"><button type="button" rel="tooltip" title="Remove" class="btn btn-danger btn-simple btn-xs"><i class="fa fa-times"></i></button></td></tr>');
	});
	
	
}
