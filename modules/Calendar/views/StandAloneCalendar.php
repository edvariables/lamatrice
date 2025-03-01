<?php
/*+**********************************************************************************
 * The contents of this file are subject to the vtiger CRM Public License Version 1.1
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is:  vtiger CRM Open Source
 * The Initial Developer of the Original Code is vtiger.
 * Portions created by vtiger are Copyright (C) vtiger.
 * All Rights Reserved.
 ************************************************************************************/

	function vtws_StandAlonePublicCalendar($userId = null){
		global $adb;
		
		$sql = "SELECT vtiger_activity.subject,  vtiger_activity.activitytype, vtiger_activity.date_start, vtiger_activity.due_date
				FROM vtiger_crmentity
				INNER JOIN vtiger_activity 
					ON vtiger_crmentity.crmid = vtiger_activity.activityid
				INNER JOIN vtiger_activitycf 
					ON vtiger_crmentity.crmid = vtiger_activitycf.activityid
				WHERE (date_start >= ?
				OR due_date > ?)
				AND vtiger_crmentity.deleted = 0
				AND vtiger_activity.visibility != 'Private'"./*ED211221*/"
				ORDER BY vtiger_activity.date_start
				LIMIT 366";
		
		$params = array();
		$params[] = date('Y-m-01');
		$params[] = date('Y-m-01');
		$minDate = null;
		$maxDate = null;
		$result = $adb->pquery($sql, $params);
		if($result != null && isset($result)){
			$nbResults = $adb->num_rows($result);
			$listViewEntries = array();
			$oneDayInterval = new DateInterval('P1D');
			for($index = 0; $index < $nbResults; $index++){
				$rawData = $adb->query_result_rowdata($result, $index);
// var_dump($rawData);
				$dStart = new DateTime($rawData['date_start']);
				if( ! $minDate) {
					$minDate = new DateTime();
					$minDate->setDate($minDate->format('Y'), $minDate->format('n'), 1);
					//Init 
					$dEnd = clone $dStart;
					for($date = clone $minDate; $date < $dEnd; $date->add($oneDayInterval)){
						$listViewEntries[$date->format('Y-m-d')] = $date;
					}
				}
				$dEnd = new DateTime($rawData['due_date']);
				for($date = $dStart; $date < $dEnd; $date->add($oneDayInterval)){
					$listViewEntries[$date->format('Y-m-d')] = $date;
				}
			}
			$maxDate = $date;
//var_dump($listViewEntries);
			if(count($listViewEntries)){
				$viewer = new Vtiger_Viewer();
				$viewer->assign('PAGETITLE', getTranslatedString('APPTITLE'));
				$moduleName = "Calendar";
				$viewer->assign('LISTVIEW_ENTRIES', $listViewEntries);
				$viewer->assign('DATE_MIN', $minDate);
				$viewer->assign('DATE_MAX', $maxDate);
				$viewer->assign('INTERVAL1DAY', new DateInterval('P1D'));
				$viewer->view('StandAloneCalendar.tpl', $moduleName);
			}
		}
		die();
		return null;
	}
	
class Calendar_StandAloneCalendar_View extends Vtiger_ListAjax_View {

	function __construct() {
		parent::__construct();
	}

	function loginRequired() {
		return false;
	}
	
	function checkPermission(Vtiger_Request $request) {
		return true;
	}

	function preProcess(Vtiger_Request $request, $display = true) {
		return true;
	}

	function postProcess(Vtiger_Request $request) {
		return true;
	}

	function process(Vtiger_Request $request) {
		$viewer = $this->getViewer($request);
		$moduleName = $request->getModule();
		$moduleModel = Vtiger_Module_Model::getInstance($moduleName);
		$this->viewName = $request->get('viewname');

		$request->set('orderby', 'date_start');
		$request->set('pagelimit', '999');
		
		$this->initializeListViewContents($request, $viewer);
		$viewer->assign('VIEW', $request->get('view'));
		$viewer->assign('MODULE_MODEL', $moduleModel);
		$viewer->assign('CURRENT_USER_MODEL', Users_Record_Model::getCurrentUserModel());
		
        $recordModel = Vtiger_Record_Model::getCleanInstance($moduleName);
		$viewer->assign('RECORD_MODEL', $recordModel);
		
		$viewer->view('StandAloneCalendar.tpl', $moduleName);
	}
}