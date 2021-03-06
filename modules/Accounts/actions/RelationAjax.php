<?php
/*+***********************************************************************************
 * The contents of this file are subject to the vtiger CRM Public License Version 1.0
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is:  vtiger CRM Open Source
 * The Initial Developer of the Original Code is vtiger.
 * Portions created by vtiger are Copyright (C) vtiger.
 * All Rights Reserved.
 *************************************************************************************/

class Accounts_RelationAjax_Action extends Vtiger_RelationAjax_Action {
	
	/**
	 * Function to delete the relation for specified source record id and related record id list
	 * @param <array> $request
	 *		keys					Content
	 *		src_module				source module name
	 *		src_record				source record id
	 *		related_module			related module name
	 *		related_record_list		json encoded of list of related record ids
	 *
	 *		ED151216
	 *			SalesOrder : delete record et non la relation
	 */
	function deleteRelation($request) {

		$relatedModule = $request->get('related_module');
		switch($relatedModule){
		case "SalesOrder":
			/* Suppression complète du dépôt-vente */
			$relatedRecordIds = $request->get('related_record_list');
			foreach($relatedRecordIds as $relatedRecordId){
				$relatedRecordModel = Vtiger_Record_Model::getInstanceById($relatedRecordId, $relatedModule);
				$relatedRecordModel->delete();
			}
			break;
		default:
			parent::deleteRelation($request);
			break;
		}
	}
}
